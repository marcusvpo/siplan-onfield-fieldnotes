-- Remove a política insegura que permitia leitura pública da tabela users
DROP POLICY IF EXISTS "Debug SELECT" ON public.users;