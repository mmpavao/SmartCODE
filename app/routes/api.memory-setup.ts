/**
 * KODA MEMORY SETUP
 * Rota de admin para criar as tabelas do sistema de memória no Supabase
 * Acessar: POST /api/memory-setup com header x-admin-key: [SUPABASE_SERVICE_ROLE_KEY]
 */

import type { ActionFunctionArgs } from '@remix-run/cloudflare';

export async function action({ request, context }: ActionFunctionArgs) {
  const adminKey = request.headers.get('x-admin-key');
  const env = context.cloudflare?.env as Record<string, string> | undefined;
  const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';

  if (!adminKey || adminKey !== serviceKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const migrationSQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS koda_memory (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   text NOT NULL,
  user_key     text NOT NULL DEFAULT 'default',
  content      text NOT NULL,
  project_name text,
  tech_stack   text[],
  embedding    vector(1536),
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS koda_memory_embedding_idx
  ON koda_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS koda_memory_user_idx ON koda_memory (user_key);
CREATE INDEX IF NOT EXISTS koda_memory_session_idx ON koda_memory (session_id);

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
  SELECT m.id, m.content, m.project_name, m.tech_stack, m.metadata,
    (1 - (m.embedding <=> query_embedding))::float AS similarity, m.created_at
  FROM koda_memory m
  WHERE m.user_key = p_user_key
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> query_embedding)) > p_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT p_limit;
END;
$$;

ALTER TABLE koda_memory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'koda_memory' AND policyname = 'allow_service_role') THEN
    CREATE POLICY "allow_service_role" ON koda_memory USING (true) WITH CHECK (true);
  END IF;
END $$;
  `;

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Execute this SQL in Supabase Studio > SQL Editor',
      sql: migrationSQL,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
