-- Remove test data completely
DELETE FROM public.blocos WHERE autor_id IN (
  SELECT id FROM public.users WHERE nome = 'João Silva'
);

DELETE FROM public.anexos WHERE autor_id IN (
  SELECT id FROM public.users WHERE nome = 'João Silva'
);

DELETE FROM public.relatorios WHERE created_by IN (
  SELECT id FROM public.users WHERE nome = 'João Silva'
);

DELETE FROM public.auditoria WHERE usuario_id IN (
  SELECT id FROM public.users WHERE nome = 'João Silva'
);

DELETE FROM public.projetos WHERE usuario_id IN (
  SELECT id FROM public.users WHERE nome = 'João Silva'
);

-- Remove test user
DELETE FROM public.users WHERE nome = 'João Silva';

-- Ensure admin user exists in public.users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = 'admin@siplan.com.br' AND tipo = 'admin'
  ) THEN
    INSERT INTO public.users (auth_id, nome, email, tipo, ativo)
    SELECT 
      id,
      'Administrador do Sistema',
      'admin@siplan.com.br',
      'admin',
      true
    FROM auth.users 
    WHERE email = 'admin@siplan.com.br'
    LIMIT 1;
  END IF;
END $$;