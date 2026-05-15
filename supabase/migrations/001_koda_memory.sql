-- =============================================================
-- KODA MEMORY SYSTEM — Migration 001
-- Execute no Supabase Studio > SQL Editor
-- =============================================================

-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de memória do Koda (sem dependências externas)
CREATE TABLE IF NOT EXISTS koda_memory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   text NOT NULL,                    -- ID da sessão/conversa
  user_key     text NOT NULL DEFAULT 'default',  -- identificador do usuário (pode ser IP, cookie, etc)
  content      text NOT NULL,                    -- conteúdo resumido da memória
  project_name text,                             -- nome do projeto detectado
  tech_stack   text[],                           -- stack tecnológica usada
  embedding    vector(1536),                     -- embedding gerado pela OpenAI
  metadata     jsonb DEFAULT '{}'::jsonb,        -- metadados extras
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Índice vetorial para busca semântica (cosine similarity)
CREATE INDEX IF NOT EXISTS koda_memory_embedding_idx
  ON koda_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Índices de acesso
CREATE INDEX IF NOT EXISTS koda_memory_user_idx     ON koda_memory (user_key);
CREATE INDEX IF NOT EXISTS koda_memory_session_idx  ON koda_memory (session_id);
CREATE INDEX IF NOT EXISTS koda_memory_created_idx  ON koda_memory (created_at DESC);

-- Função de busca semântica
CREATE OR REPLACE FUNCTION search_koda_memory(
  query_embedding  vector(1536),
  p_user_key       text DEFAULT 'default',
  p_threshold      float DEFAULT 0.70,
  p_limit          int DEFAULT 5
)
RETURNS TABLE (
  id           uuid,
  content      text,
  project_name text,
  tech_stack   text[],
  metadata     jsonb,
  similarity   float,
  created_at   timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.project_name,
    m.tech_stack,
    m.metadata,
    (1 - (m.embedding <=> query_embedding))::float AS similarity,
    m.created_at
  FROM koda_memory m
  WHERE m.user_key = p_user_key
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) > p_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT p_limit;
END;
$$;

-- RLS: habilitar mas deixar aberto por enquanto (sem auth)
ALTER TABLE koda_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_service_role" ON koda_memory
  USING (true)
  WITH CHECK (true);

