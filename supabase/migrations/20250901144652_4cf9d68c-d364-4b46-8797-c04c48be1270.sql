-- Atualizar políticas RLS para a nova estrutura de paths
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all reports" ON storage.objects;

-- Criar novas políticas para a estrutura relatorios/user_id/project_id/arquivo.html
CREATE POLICY "Users can view their own project reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'relatorios' AND 
  (storage.foldername(name))[1] = auth.uid()::text AND
  user_owns_project(((storage.foldername(name))[2])::uuid)
);

-- Política para permitir que admins vejam todos os relatórios
CREATE POLICY "Admins can view all project reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'relatorios' AND is_admin());