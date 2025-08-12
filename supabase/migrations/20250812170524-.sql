-- Fix RLS for public.users to resolve 406 during implantador login and remove insecure debug policies

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that may conflict or are insecure
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users if admin, or self" ON public.users;
DROP POLICY IF EXISTS "Implantadores can view self and other implantadores if active" ON public.users;
DROP POLICY IF EXISTS "Debug DELETE" ON public.users;
DROP POLICY IF EXISTS "Debug INSERT" ON public.users;
DROP POLICY IF EXISTS "Debug UPDATE" ON public.users;
DROP POLICY IF EXISTS "Debug SELECT" ON public.users;

-- 1) Anon: Allow implantador lookup for login
CREATE POLICY "Anon: Allow implantador lookup for login"
ON public.users
FOR SELECT
TO anon
USING (
  tipo = 'implantador'::public.user_type
  AND ativo = true
);

-- 2) Authenticated: Allow self view
CREATE POLICY "Authenticated: Allow self view"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid()
);

-- 3) Implantador: View active implantadores
CREATE POLICY "Implantador: View active implantadores"
ON public.users
FOR SELECT
TO authenticated
USING (
  tipo = 'implantador'::public.user_type
  AND ativo = true
);

-- 4) Admin: View all users
CREATE POLICY "Admin: View all users"
ON public.users
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- 5) Admin: Update any user
CREATE POLICY "Admin: Update any user"
ON public.users
FOR UPDATE
TO authenticated
USING (
  is_admin()
)
WITH CHECK (
  is_admin()
);

-- 6) Authenticated: Allow self update
CREATE POLICY "Authenticated: Allow self update"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth_id = auth.uid()
)
WITH CHECK (
  auth_id = auth.uid()
);
