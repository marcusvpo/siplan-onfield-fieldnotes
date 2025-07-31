-- Migrate projects to use auth_id instead of internal user id
-- First, let's see current state and update the usuario_id field to reference auth_id

-- Update existing projects to use auth_id
UPDATE public.projetos 
SET usuario_id = (
  SELECT auth_id::text 
  FROM public.users 
  WHERE users.id::text = projetos.usuario_id
)
WHERE usuario_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id::text = projetos.usuario_id
  );

-- Add comment to clarify that usuario_id now stores auth_id
COMMENT ON COLUMN public.projetos.usuario_id IS 'References auth.users.id (auth_id) instead of users.id';