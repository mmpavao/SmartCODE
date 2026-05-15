/**
 * KODA MEMORY SERVICE
 * Persistência semântica de contexto entre sessões usando pgvector no Supabase
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MemoryService');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENAI_KEY = import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

export interface MemoryEntry {
  id?: string;
  session_id: string;
  user_key: string;
  content: string;
  project_name?: string;
  tech_stack?: string[];
  metadata?: Record<string, unknown>;
  similarity?: number;
  created_at?: string;
}

/**
 * Gera embedding via OpenAI text-embedding-3-small (1536 dims)
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_KEY) {
    logger.warn('OpenAI key not available for embeddings');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text.slice(0, 8000), // Limitar tokens
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      logger.error('Embedding API error:', response.status);
      return null;
    }

    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding ?? null;
  } catch (err) {
    logger.error('Failed to generate embedding:', err);
    return null;
  }
}

/**
 * Salva uma memória no Supabase com embedding
 */
export async function saveMemory(entry: MemoryEntry): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    logger.warn('Supabase not configured — memory disabled');
    return false;
  }

  try {
    const embedding = await generateEmbedding(entry.content);

    const payload: Record<string, unknown> = {
      session_id: entry.session_id,
      user_key: entry.user_key,
      content: entry.content,
      project_name: entry.project_name ?? null,
      tech_stack: entry.tech_stack ?? null,
      metadata: entry.metadata ?? {},
    };

    if (embedding) {
      payload.embedding = `[${embedding.join(',')}]`;
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/koda_memory`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('Save memory failed:', err);
      return false;
    }

    logger.debug('Memory saved for session:', entry.session_id);
    return true;
  } catch (err) {
    logger.error('saveMemory error:', err);
    return false;
  }
}

/**
 * Busca memórias relevantes por similaridade semântica
 */
export async function searchMemories(
  query: string,
  userKey: string,
  options: { threshold?: number; limit?: number } = {},
): Promise<MemoryEntry[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return [];
  }

  try {
    const embedding = await generateEmbedding(query);

    if (!embedding) {
      return [];
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_koda_memory`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query_embedding: embedding,
        p_user_key: userKey,
        p_threshold: options.threshold ?? 0.7,
        p_limit: options.limit ?? 5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.warn('Search memories failed:', err);
      return [];
    }

    const results = (await res.json()) as MemoryEntry[];
    logger.debug(`Found ${results.length} memories for user:`, userKey);
    return results;
  } catch (err) {
    logger.error('searchMemories error:', err);
    return [];
  }
}

/**
 * Formata memórias para injetar no system prompt
 */
export function formatMemoriesForPrompt(memories: MemoryEntry[]): string {
  if (!memories.length) return '';

  const formatted = memories
    .map((m, i) => {
      const stack = m.tech_stack?.length ? ` [${m.tech_stack.join(', ')}]` : '';
      const project = m.project_name ? ` — ${m.project_name}` : '';
      const date = m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : '';
      return `${i + 1}. ${date}${project}${stack}: ${m.content}`;
    })
    .join('\n');

  return `<user_memory>
The following are relevant past projects and context from this user's previous sessions with Koda. Use this to provide continuity and avoid repeating mistakes:

${formatted}
</user_memory>`;
}

/**
 * Extrai informações do projeto da conversa atual para salvar na memória
 */
export function extractProjectInfo(messages: Array<{ role: string; content: string }>): {
  summary: string;
  projectName?: string;
  techStack?: string[];
} {
  const allText = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n')
    .slice(0, 4000);

  // Detectar stack tecnológica
  const stackMap: Record<string, string[]> = {
    React: ['react', 'jsx', 'tsx'],
    'Next.js': ['next.js', 'nextjs', 'next/'],
    Vue: ['vue', 'nuxt'],
    Vite: ['vite', 'vite.config'],
    Tailwind: ['tailwind', 'tw-'],
    Supabase: ['supabase', 'createClient'],
    TypeScript: ['typescript', '.ts', 'tsx'],
    Node: ['node.js', 'nodejs', 'express', 'fastify'],
    Python: ['python', 'fastapi', 'django', 'flask'],
  };

  const detectedStack: string[] = [];
  const lowerText = allText.toLowerCase();

  for (const [tech, patterns] of Object.entries(stackMap)) {
    if (patterns.some((p) => lowerText.includes(p))) {
      detectedStack.push(tech);
    }
  }

  // Detectar nome do projeto
  const projectMatch = allText.match(/(?:project|app|application|build)[:\s]+["']?([A-Z][a-zA-Z\s]{2,30})["']?/i);
  const projectName = projectMatch?.[1]?.trim();

  // Criar resumo compacto
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content).join(' ').slice(0, 500);

  return {
    summary: userMessages || allText.slice(0, 500),
    projectName,
    techStack: detectedStack.length ? detectedStack : undefined,
  };
}
