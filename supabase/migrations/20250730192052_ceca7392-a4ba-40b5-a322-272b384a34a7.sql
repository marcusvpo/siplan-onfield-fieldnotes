-- Create table for project comments/notes
CREATE TABLE public.comentarios_projeto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comentarios_projeto ENABLE ROW LEVEL SECURITY;

-- Create policies for project comments
CREATE POLICY "Users can view comments from their projects" 
ON public.comentarios_projeto 
FOR SELECT 
USING (is_admin() OR user_owns_project(projeto_id));

CREATE POLICY "Users can insert comments in their projects" 
ON public.comentarios_projeto 
FOR INSERT 
WITH CHECK (is_admin() OR user_owns_project(projeto_id));

CREATE POLICY "Users can update their own comments" 
ON public.comentarios_projeto 
FOR UPDATE 
USING (is_admin() OR (user_owns_project(projeto_id) AND (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = comentarios_projeto.usuario_id) AND (users.auth_id = auth.uid()))))));

CREATE POLICY "Admins can delete comments" 
ON public.comentarios_projeto 
FOR DELETE 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comentarios_projeto_updated_at
BEFORE UPDATE ON public.comentarios_projeto
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();