-- Check the column types first
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projetos' AND column_name = 'usuario_id'
UNION ALL
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('id', 'auth_id');