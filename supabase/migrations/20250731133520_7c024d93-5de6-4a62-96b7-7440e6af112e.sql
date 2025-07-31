-- Migrate projects to use auth_id instead of internal user id
-- Fix type casting issue

-- Update existing projects to use auth_id
UPDATE public.projetos 
SET usuario_id = users.auth_id::text 
FROM public.users 
WHERE users.id::text = projetos.usuario_id
  AND users.auth_id IS NOT NULL;

-- Add comment to clarify that usuario_id now stores auth_id
COMMENT ON COLUMN public.projetos.usuario_id IS 'References auth.users.id (auth_id) instead of users.id';