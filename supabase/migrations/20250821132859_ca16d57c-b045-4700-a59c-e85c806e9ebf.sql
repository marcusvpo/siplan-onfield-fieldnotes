-- Create storage bucket for project files if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
SELECT 'project_files', 'project_files', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project_files');

-- Create policies for project files bucket
CREATE POLICY IF NOT EXISTS "Users can view project files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project_files' AND (is_admin() OR user_owns_project_from_path(name)));

CREATE POLICY IF NOT EXISTS "Users can upload project files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'project_files' AND (is_admin() OR user_owns_project_from_path(name)));

CREATE POLICY IF NOT EXISTS "Users can update their project files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'project_files' AND (is_admin() OR user_owns_project_from_path(name)));

CREATE POLICY IF NOT EXISTS "Users can delete their project files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'project_files' AND (is_admin() OR user_owns_project_from_path(name)));

-- Create function to check if user owns project from file path
CREATE OR REPLACE FUNCTION user_owns_project_from_path(file_path TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_uuid UUID;
    user_owns_project BOOLEAN := FALSE;
BEGIN
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Extract project ID from path like "projetos/PROJECT_ID/anexos/filename"
    project_uuid := (SELECT (regexp_matches(file_path, 'projetos/([a-f0-9-]+)/'))[1]::UUID);
    
    IF project_uuid IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM projetos 
            WHERE id = project_uuid AND usuario_id = auth.uid()
        ) INTO user_owns_project;
    END IF;
    
    RETURN user_owns_project;
END;
$$;