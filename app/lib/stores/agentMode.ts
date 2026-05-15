/**
 * KODA AGENT MODES
 * Lite / Economy / Power — inspirado no Replit Agent
 *
 * Lite    → modelos rápidos e baratos (edits simples, UI tweaks)
 * Economy → equilíbrio velocidade/qualidade (maioria dos builds)
 * Power   → modelos top-tier para lógica complexa e raciocínio profundo
 */
import { atom, computed } from 'nanostores';

export type AgentMode = 'lite' | 'economy' | 'power';

export interface AgentModeConfig {
  id: AgentMode;
  label: string;
  description: string;
  longDescription: string;
  // Modelos mapeados por provider (seleção automática na Koda)
  models: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  // Features habilitadas por modo
  features: {
    appTesting: boolean;
    codeOptimization: boolean;
    deepReasoning: boolean;
    turbo: boolean;
  };
}

export const AGENT_MODES: Record<AgentMode, AgentModeConfig> = {
  lite: {
    id: 'lite',
    label: 'Lite',
    description: 'Fast, lightweight models for quick edits and iterations.',
    longDescription: 'Fast, lightweight models for quick edits and iterations. Best mode for small changes and visual tweaks.',
    models: {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-1.5-flash',
    },
    features: {
      appTesting: false,
      codeOptimization: false,
      deepReasoning: false,
      turbo: false,
    },
  },
  economy: {
    id: 'economy',
    label: 'Economy',
    description: 'Cost-optimized models for everyday tasks.',
    longDescription: 'Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds.',
    models: {
      openai: 'gpt-4o',
      anthropic: 'claude-3-5-sonnet-20241022',
      google: 'gemini-1.5-pro',
    },
    features: {
      appTesting: true,
      codeOptimization: true,
      deepReasoning: false,
      turbo: false,
    },
  },
  power: {
    id: 'power',
    label: 'Power',
    description: 'Higher-performance models for complex work.',
    longDescription: 'Higher-performance models for complex work. Best for larger changes, deeper reasoning, and longer builds.',
    models: {
      openai: 'o3',
      anthropic: 'claude-opus-4-5',
      google: 'gemini-2.0-flash',
    },
    features: {
      appTesting: true,
      codeOptimization: true,
      deepReasoning: true,
      turbo: false,
    },
  },
};

// Persistir no localStorage
function loadMode(): AgentMode {
  try {
    const saved = localStorage.getItem('koda_agent_mode') as AgentMode;
    if (saved && saved in AGENT_MODES) return saved;
  } catch {}
  return 'economy'; // default
}

export const agentModeStore = atom<AgentMode>(
  typeof window !== 'undefined' ? loadMode() : 'economy'
);

export const currentModeConfig = computed(agentModeStore, (mode) => AGENT_MODES[mode]);

export function setAgentMode(mode: AgentMode) {
  agentModeStore.set(mode);
  try {
    localStorage.setItem('koda_agent_mode', mode);
  } catch {}
}

/**
 * Retorna o modelo ideal para o provider ativo baseado no modo atual
 */
export function getModelForMode(mode: AgentMode, providerName: string): string | null {
  const config = AGENT_MODES[mode];
  const providerMap: Record<string, keyof typeof config.models> = {
    OpenAI: 'openai',
    Anthropic: 'anthropic',
    Google: 'google',
  };
  const key = providerMap[providerName];
  return key ? config.models[key] || null : null;
}
