-- Convert projetos.sistema from enum to text to allow dynamic systems list
DO $$
BEGIN
  -- Only alter if column exists and is an enum
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    JOIN pg_type t ON t.typname = (SELECT pg_type.typname FROM pg_type WHERE pg_type.oid = (
      SELECT atttypid FROM pg_attribute a
      JOIN pg_class cls ON cls.oid = a.attrelid
      WHERE cls.relname = 'projetos' AND a.attname = 'sistema' AND a.attnum > 0 AND NOT a.attisdropped
      LIMIT 1
    ))
    WHERE c.table_schema = 'public' AND c.table_name = 'projetos' AND c.column_name = 'sistema'
  ) THEN
    -- Attempt to alter column type to text
    BEGIN
      ALTER TABLE public.projetos
      ALTER COLUMN sistema TYPE text USING sistema::text;
    EXCEPTION WHEN others THEN
      -- In case of complex enum casting issues, raise a clearer error
      RAISE EXCEPTION 'Failed to convert projetos.sistema to text. Please ensure no dependent constraints rely on the enum.';
    END;
  END IF;
END $$;

-- Ensure no default constraint remains that references an enum value
ALTER TABLE public.projetos ALTER COLUMN sistema DROP DEFAULT;

-- Keep existing values as-is; no data migration needed since we cast enum to its text label.

-- RLS remains unchanged.
