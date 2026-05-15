-- =============================================================
-- KODA AUTH + MULTI-TENANT — Migration 002
-- Execute no Supabase Studio > SQL Editor
-- =============================================================

-- ============================================================
-- 1. Habilitar Auth no projeto Supabase
--    (isso é feito via Supabase Dashboard > Authentication)
--    Habilitar: Email/Password + Magic Link + Google OAuth
-- ============================================================

-- 2. Perfil público de usuário (extends auth.users)
CREATE TABLE IF NOT EXISTS koda_users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  display_name text,
  avatar_url   text,
  plan         text DEFAULT 'free',   -- free | pro | enterprise
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Trigger para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_koda_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO koda_users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_koda_user();

-- 3. RLS para koda_users
ALTER TABLE koda_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile" ON koda_users
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "service_role_all" ON koda_users
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Atualizar koda_memory para usar auth.uid()
-- Adicionar coluna auth_user_id se não existir
ALTER TABLE koda_memory ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS koda_memory_auth_user_idx ON koda_memory (auth_user_id);

-- Atualizar RLS da koda_memory para isolar por usuário autenticado
DROP POLICY IF EXISTS "allow_all_service_role" ON koda_memory;
DROP POLICY IF EXISTS "allow_service_role" ON koda_memory;

CREATE POLICY "memory_owner_access" ON koda_memory
  FOR ALL USING (
    auth_user_id IS NULL OR  -- permite acesso anônimo (compatibilidade)
    auth.uid() = auth_user_id OR
    auth.role() = 'service_role'
  );

-- 5. Projetos por usuário
CREATE TABLE IF NOT EXISTS koda_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  tech_stack   text[],
  chat_ids     text[] DEFAULT '{}',  -- IDs dos chats no IndexedDB
  metadata     jsonb DEFAULT '{}'::jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS koda_projects_user_idx ON koda_projects (user_id);

ALTER TABLE koda_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_owner" ON koda_projects
  FOR ALL USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- 6. Atualizar função de busca para suporte a auth_user_id
CREATE OR REPLACE FUNCTION search_koda_memory(
  query_embedding  vector(1536),
  p_user_key       text DEFAULT 'default',
  p_auth_user_id   uuid DEFAULT NULL,
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
    m.id, m.content, m.project_name, m.tech_stack, m.metadata,
    (1 - (m.embedding <=> query_embedding))::float AS similarity,
    m.created_at
  FROM koda_memory m
  WHERE (
    (p_auth_user_id IS NOT NULL AND m.auth_user_id = p_auth_user_id) OR
    (p_auth_user_id IS NULL AND m.user_key = p_user_key)
  )
  AND m.embedding IS NOT NULL
  AND (1 - (m.embedding <=> query_embedding)) > p_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT p_limit;
END;
$$;

