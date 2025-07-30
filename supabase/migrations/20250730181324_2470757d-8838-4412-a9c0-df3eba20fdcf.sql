-- Remove test data and ensure clean state
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

DELETE FROM public.users WHERE nome = 'João Silva';

-- Ensure admin user exists in public.users table
INSERT INTO public.users (auth_id, nome, email, tipo, ativo)
SELECT 
  id,
  'Administrador do Sistema',
  'admin@siplan.com.br',
  'admin',
  true
FROM auth.users 
WHERE email = 'admin@siplan.com.br'
ON CONFLICT (auth_id) DO UPDATE SET
  nome = 'Administrador do Sistema',
  tipo = 'admin',
  ativo = true;