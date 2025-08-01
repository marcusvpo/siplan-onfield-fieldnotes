-- Criar tabela para sistemas configuráveis
CREATE TABLE public.sistemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir sistemas padrão
INSERT INTO public.sistemas (nome, ativo) VALUES 
('e-Cart', true),
('Sistema CNJ', true),
('CertDig', true);

-- Criar tabela para status de projeto configuráveis
CREATE TABLE public.status_projeto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cor TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir status padrão
INSERT INTO public.status_projeto (nome, cor, ordem, ativo) VALUES 
('Aguardando', '#64748b', 1, true),
('Em Andamento', '#3b82f6', 2, true),
('Pausado', '#f59e0b', 3, true),
('Finalizado', '#10b981', 4, true),
('Cancelado', '#ef4444', 5, true);

-- Criar tabela de auditoria para últimas atividades
CREATE TABLE public.atividades_recentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades_recentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para sistemas (apenas admins podem gerenciar)
CREATE POLICY "Admins can manage sistemas" ON public.sistemas FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Everyone can view active sistemas" ON public.sistemas FOR SELECT USING (ativo = true);

-- Políticas RLS para status_projeto (apenas admins podem gerenciar)
CREATE POLICY "Admins can manage status_projeto" ON public.status_projeto FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Everyone can view active status_projeto" ON public.status_projeto FOR SELECT USING (ativo = true);

-- Políticas RLS para atividades_recentes
CREATE POLICY "Users can view activities from their projects" ON public.atividades_recentes FOR SELECT USING (is_admin() OR user_owns_project(projeto_id));
CREATE POLICY "Users can insert activities in their projects" ON public.atividades_recentes FOR INSERT WITH CHECK (is_admin() OR user_owns_project(projeto_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sistemas_updated_at BEFORE UPDATE ON public.sistemas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_status_projeto_updated_at BEFORE UPDATE ON public.status_projeto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para registrar atividades automáticas
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  acao_text TEXT;
  projeto_nome TEXT;
BEGIN
  SELECT id INTO current_user_id FROM public.users WHERE auth_id = auth.uid();
  SELECT nome_cartorio INTO projeto_nome FROM public.projetos WHERE id = COALESCE(NEW.id, OLD.id);
  
  IF TG_OP = 'INSERT' THEN
    acao_text := 'Projeto criado';
    INSERT INTO public.atividades_recentes (projeto_id, usuario_id, acao, descricao)
    VALUES (NEW.id, current_user_id, acao_text, 'Novo projeto ' || projeto_nome || ' foi criado');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      acao_text := 'Status alterado';
      INSERT INTO public.atividades_recentes (projeto_id, usuario_id, acao, descricao)
      VALUES (NEW.id, current_user_id, acao_text, 'Status do projeto ' || projeto_nome || ' alterado para ' || NEW.status);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    acao_text := 'Projeto excluído';
    INSERT INTO public.atividades_recentes (projeto_id, usuario_id, acao, descricao)
    VALUES (OLD.id, current_user_id, acao_text, 'Projeto ' || projeto_nome || ' foi excluído');
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger para log automático de atividades
CREATE TRIGGER log_project_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.projetos
  FOR EACH ROW EXECUTE FUNCTION public.log_project_activity();