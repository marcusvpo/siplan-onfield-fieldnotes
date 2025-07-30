-- Create admin user in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@siplan.com.br',
  crypt('siplan123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"tipo":"admin","nome":"Administrador do Sistema"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('siplan123', gen_salt('bf')),
  raw_user_meta_data = '{"tipo":"admin","nome":"Administrador do Sistema"}',
  updated_at = now();

-- Create corresponding user in public.users table
INSERT INTO public.users (auth_id, nome, email, tipo)
SELECT 
  au.id,
  'Administrador do Sistema',
  'admin@siplan.com.br',
  'admin'::user_type
FROM auth.users au 
WHERE au.email = 'admin@siplan.com.br'
ON CONFLICT (auth_id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  tipo = EXCLUDED.tipo;

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

-- Add username column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create function to create implantador users via admin panel
CREATE OR REPLACE FUNCTION public.create_implantador_user(
  p_username text,
  p_password text,
  p_nome text,
  p_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_auth_id uuid;
  new_user_id uuid;
BEGIN
  -- Only admins can create users
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('tipo', 'implantador', 'nome', p_nome, 'username', p_username),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_auth_id;

  -- Create corresponding user in public.users
  INSERT INTO public.users (auth_id, nome, email, tipo, username)
  VALUES (new_auth_id, p_nome, p_email, 'implantador', p_username)
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$;