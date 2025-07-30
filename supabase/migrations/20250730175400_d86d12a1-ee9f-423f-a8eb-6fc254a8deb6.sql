-- Add username column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Remove test data (João Silva and related projects)
DELETE FROM public.auditoria WHERE projeto_id IN (
  SELECT id FROM public.projetos WHERE usuario_id IN (
    SELECT id FROM public.users WHERE nome LIKE '%João Silva%'
  )
);

DELETE FROM public.blocos WHERE projeto_id IN (
  SELECT id FROM public.projetos WHERE usuario_id IN (
    SELECT id FROM public.users WHERE nome LIKE '%João Silva%'
  )
);

DELETE FROM public.anexos WHERE projeto_id IN (
  SELECT id FROM public.projetos WHERE usuario_id IN (
    SELECT id FROM public.users WHERE nome LIKE '%João Silva%'
  )
);

DELETE FROM public.relatorios WHERE projeto_id IN (
  SELECT id FROM public.projetos WHERE usuario_id IN (
    SELECT id FROM public.users WHERE nome LIKE '%João Silva%'
  )
);

DELETE FROM public.projetos WHERE usuario_id IN (
  SELECT id FROM public.users WHERE nome LIKE '%João Silva%'
);

DELETE FROM public.users WHERE nome LIKE '%João Silva%';

-- Create function to authenticate implantador by username
CREATE OR REPLACE FUNCTION public.authenticate_implantador(
  p_username text,
  p_password text
)
RETURNS table(
  id uuid,
  email text,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Find user by username in public.users table
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data
  FROM auth.users au
  JOIN public.users pu ON au.id = pu.auth_id
  WHERE pu.username = p_username
    AND pu.tipo = 'implantador'
    AND pu.ativo = true
    AND au.encrypted_password = crypt(p_password, au.encrypted_password);
END;
$$;