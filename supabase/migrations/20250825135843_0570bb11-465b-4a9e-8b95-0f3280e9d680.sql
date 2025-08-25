-- Remove image_url column from comentarios_projeto table
ALTER TABLE public.comentarios_projeto DROP COLUMN IF EXISTS image_url;

-- Remove image type from the type enum if it exists
-- Note: We'll keep the type column as text with default 'text'