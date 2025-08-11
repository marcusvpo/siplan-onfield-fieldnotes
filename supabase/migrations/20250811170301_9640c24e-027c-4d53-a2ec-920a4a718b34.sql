-- 1) Adaptações na tabela comentarios_projeto para suportar áudio
--   - Adiciona coluna "type" para diferenciar texto/áudio
--   - Adiciona coluna "audio_url" para armazenar o caminho do arquivo no Storage
--   Observação: usamos ADD COLUMN IF NOT EXISTS para manter idempotência

ALTER TABLE public.comentarios_projeto
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text';

ALTER TABLE public.comentarios_projeto
  ADD COLUMN IF NOT EXISTS audio_url TEXT NULL;

-- Opcional: restringir valores permitidos (mantendo simples com CHECK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comentarios_projeto_type_allowed_values'
  ) THEN
    ALTER TABLE public.comentarios_projeto
      ADD CONSTRAINT comentarios_projeto_type_allowed_values
      CHECK (type IN ('text','audio'));
  END IF;
END $$;

-- 2) Bucket de Storage para arquivos dos projetos
-- Cria bucket 'project_files' (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_files', 'project_files', false)
ON CONFLICT (id) DO NOTHING;

-- 3) Políticas RLS em storage.objects para o bucket 'project_files'
-- Convenção de caminho: projetos/<project_id>/audios/<timestamp>_<auth_id>.webm
-- A validação usa o segundo segmento do caminho (project_id)

-- 3.1 INSERT: usuários autenticados podem fazer upload se forem donos do projeto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can upload project files (project_files)'
  ) THEN
    CREATE POLICY "Users can upload project files (project_files)"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'project_files'
      AND (storage.foldername(name))[1] = 'projetos'
      AND public.user_owns_project(((storage.foldername(name))[2])::uuid)
    );
  END IF;
END $$;

-- 3.2 SELECT: usuários autenticados podem ver arquivos dos projetos que possuem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can view own project files (project_files)'
  ) THEN
    CREATE POLICY "Users can view own project files (project_files)"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'project_files'
      AND (storage.foldername(name))[1] = 'projetos'
      AND public.user_owns_project(((storage.foldername(name))[2])::uuid)
    );
  END IF;
END $$;

-- 3.3 DELETE: admins ou donos do projeto podem deletar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins or owners can delete files (project_files)'
  ) THEN
    CREATE POLICY "Admins or owners can delete files (project_files)"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'project_files'
      AND (
        public.is_admin() OR (
          (storage.foldername(name))[1] = 'projetos'
          AND public.user_owns_project(((storage.foldername(name))[2])::uuid)
        )
      )
    );
  END IF;
END $$;
