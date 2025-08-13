-- Add email column to users_safe_lookup for secure login
ALTER TABLE public.users_safe_lookup ADD COLUMN email text;

-- Update the sync trigger function to include email
CREATE OR REPLACE FUNCTION public.sync_users_safe_lookup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users_safe_lookup (user_id, nome, username, tipo, ativo, auth_id, email)
    VALUES (NEW.id, NEW.nome, NEW.username, NEW.tipo, NEW.ativo, NEW.auth_id, NEW.email);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.users_safe_lookup
    SET 
      nome = NEW.nome,
      username = NEW.username,
      tipo = NEW.tipo,
      ativo = NEW.ativo,
      auth_id = NEW.auth_id,
      email = NEW.email,
      updated_at = now()
    WHERE user_id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.users_safe_lookup WHERE user_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Sync existing data with email
UPDATE public.users_safe_lookup 
SET email = u.email 
FROM public.users u 
WHERE users_safe_lookup.user_id = u.id;

-- Update RLS policy to ensure email is only visible to admins or for active implantadores during login
DROP POLICY "Anonymous: Allow login lookup for active implantadores" ON public.users_safe_lookup;

CREATE POLICY "Anonymous: Allow login lookup for active implantadores with email" 
ON public.users_safe_lookup 
FOR SELECT 
USING (
  tipo = 'implantador'::user_type 
  AND ativo = true 
  AND username IS NOT NULL
);