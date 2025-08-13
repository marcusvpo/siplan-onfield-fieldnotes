-- Fix security issue: Remove email exposure from anonymous access
-- Create a safe view for anonymous login lookups that only exposes non-sensitive fields

-- Create a view that only exposes safe fields for anonymous access
CREATE OR REPLACE VIEW public.users_safe_lookup AS
SELECT 
  id,
  nome,
  username,
  tipo,
  ativo,
  auth_id
FROM public.users
WHERE tipo = 'implantador'::public.user_type AND ativo = true;

-- Enable RLS on the view
ALTER VIEW public.users_safe_lookup SET (security_invoker = true);

-- Drop the current anonymous policy that exposes all fields
DROP POLICY IF EXISTS "Anon: Allow implantador lookup for login" ON public.users;

-- Create a new restricted anonymous policy that only allows access to the safe view
-- Note: We'll update the authentication code to use this view instead of direct table access