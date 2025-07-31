-- Add telefone_contato field to projects table
ALTER TABLE public.projetos ADD COLUMN telefone_contato text;

-- Add comment to explain the field
COMMENT ON COLUMN public.projetos.telefone_contato IS 'Telefone de contato do cartório';