-- 1) Alterar coluna projetos.sistema para text[] com conversão segura
DO $$
DECLARE 
  col_is_array boolean;
BEGIN
  SELECT (a.atttypid = 'text[]'::regtype) INTO col_is_array
  FROM pg_attribute a
  WHERE a.attrelid = 'public.projetos'::regclass 
    AND a.attname = 'sistema' 
    AND NOT a.attisdropped;

  IF NOT col_is_array THEN
    ALTER TABLE public.projetos
    ALTER COLUMN sistema TYPE text[]
    USING CASE 
      WHEN sistema IS NULL THEN ARRAY[]::text[] 
      ELSE ARRAY[sistema::text] 
    END;
  END IF;
END $$;

-- 2) Ajustar policy de SELECT para garantir visibilidade correta
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'projetos' 
      AND policyname = 'Users can view their assigned projects'
  ) THEN
    DROP POLICY "Users can view their assigned projects" ON public.projetos;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'projetos' 
      AND policyname = 'Admins or assigned implantadores can view projects'
  ) THEN
    CREATE POLICY "Admins or assigned implantadores can view projects"
    ON public.projetos
    FOR SELECT
    TO authenticated
    USING (
      is_admin() OR (usuario_id = auth.uid())
    );
  END IF;
END $$;