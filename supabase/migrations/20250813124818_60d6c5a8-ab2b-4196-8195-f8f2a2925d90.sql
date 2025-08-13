-- Fix security issue: Add RLS policies to users_safe_lookup view
-- This prevents unauthorized access while maintaining login functionality

-- First, let's recreate the view as a materialized view with RLS support
DROP VIEW IF EXISTS public.users_safe_lookup;

-- Create a secure lookup table instead of a view for better RLS control
CREATE TABLE public.users_safe_lookup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  username text,
  tipo public.user_type NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  auth_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(username, tipo)
);

-- Enable RLS on the safe lookup table
ALTER TABLE public.users_safe_lookup ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for anonymous users - only for login lookup
CREATE POLICY "Anonymous: Allow login lookup for active implantadores"
ON public.users_safe_lookup
FOR SELECT
TO anon
USING (
  tipo = 'implantador'::public.user_type 
  AND ativo = true
  AND username IS NOT NULL
);

-- Create RLS policy for authenticated users to view all active users
CREATE POLICY "Authenticated: View active users"
ON public.users_safe_lookup
FOR SELECT
TO authenticated
USING (ativo = true);

-- Create RLS policy for admins to manage the lookup table
CREATE POLICY "Admin: Manage lookup table"
ON public.users_safe_lookup
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create function to sync users_safe_lookup with users table
CREATE OR REPLACE FUNCTION public.sync_users_safe_lookup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users_safe_lookup (user_id, nome, username, tipo, ativo, auth_id)
    VALUES (NEW.id, NEW.nome, NEW.username, NEW.tipo, NEW.ativo, NEW.auth_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.users_safe_lookup
    SET 
      nome = NEW.nome,
      username = NEW.username,
      tipo = NEW.tipo,
      ativo = NEW.ativo,
      auth_id = NEW.auth_id,
      updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.users_safe_lookup WHERE user_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to keep lookup table in sync
CREATE TRIGGER sync_users_safe_lookup_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_users_safe_lookup();

-- Populate the lookup table with existing data
INSERT INTO public.users_safe_lookup (user_id, nome, username, tipo, ativo, auth_id)
SELECT id, nome, username, tipo, ativo, auth_id
FROM public.users
ON CONFLICT DO NOTHING;