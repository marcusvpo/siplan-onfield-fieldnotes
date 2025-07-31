-- First remove the foreign key constraint to allow the migration
-- Then migrate projects to use auth_id instead of internal user id

-- Drop the existing foreign key constraint
ALTER TABLE public.projetos DROP CONSTRAINT IF EXISTS projetos_usuario_id_fkey;

-- Update existing projects to use auth_id
UPDATE public.projetos 
SET usuario_id = users.auth_id 
FROM public.users 
WHERE users.id = projetos.usuario_id
  AND users.auth_id IS NOT NULL;

-- Add comment to clarify that usuario_id now stores auth_id
COMMENT ON COLUMN public.projetos.usuario_id IS 'References auth.users.id (auth_id) instead of users.id';