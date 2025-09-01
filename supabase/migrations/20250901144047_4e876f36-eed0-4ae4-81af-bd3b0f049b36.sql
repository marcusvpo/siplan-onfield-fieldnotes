-- Criar políticas RLS para o bucket "relatorios"

-- Política para permitir que usuários vejam apenas seus próprios relatórios
CREATE POLICY "Users can view their own reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'relatorios' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política para permitir que admins vejam todos os relatórios
CREATE POLICY "Admins can view all reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'relatorios' AND is_admin());

-- Política para permitir que automações (service_role) insiram relatórios
CREATE POLICY "Service role can insert reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'relatorios');