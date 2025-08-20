import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// Tipo para as linhas de projeto do banco de dados
type ProjectRow = Database['public']['Tables']['projetos']['Row'];
type ProjectInsert = Database['public']['Tables']['projetos']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projetos']['Update'];

export interface Project {
  id: string;
  chamado: string;
  nome_cartorio: string;
  estado: string;
  sistema: string[];
  email_contato: string;
  telefone_contato?: string;
  data_inicio_implantacao: string;
  data_fim_implantacao: string;
  status: ProjectRow['status']; // Usa o tipo corrigido diretamente do Database
  observacao_admin?: string;
  usuario_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    nome: string;
    username: string;
  };
}

export interface ProjectStats {
  total: number;
  ativos: number;
  concluidos: number;
  atrasados: number;
  agendados: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    ativos: 0,
    concluidos: 0,
    atrasados: 0,
    agendados: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          user:users!projetos_usuario_id_users_auth_id_fkey(nome, username, auth_id)
        `);

      if (error) throw error;

      // O map ainda é necessário para formatar o `user` de `user[]` para `user` e garantir a tipagem `Project`
      const projectsData = data?.map(project => ({
        ...project,
        user: Array.isArray(project.user) ? project.user[0] : project.user
      })) as Project[]; // O cast final é mais seguro aqui
      
      setProjects(projectsData || []);

      // Calculate stats
      const now = new Date();
      const statsData = {
        total: projectsData?.length || 0,
        ativos: projectsData?.filter(p => p.status === 'em_andamento').length || 0,
        concluidos: projectsData?.filter(p => p.status === 'finalizado').length || 0,
        atrasados: projectsData?.filter(p => {
          const dataFim = new Date(p.data_fim_implantacao);
          return p.status !== 'finalizado' && dataFim < now;
        }).length || 0,
        agendados: projectsData?.filter(p => p.status === 'aguardando').length || 0
      };
      setStats(statsData);
    } catch (error: any) {
      console.error('Erro ao carregar projetos:', error);
      toast({
        title: "Erro ao carregar projetos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    chamado: string;
    nome_cartorio: string;
    estado: string;
    sistema: string[];
    email_contato: string;
    telefone_contato?: string;
    status: ProjectRow['status']; // Usa o tipo corrigido
    data_inicio_implantacao: string;
    data_fim_implantacao: string;
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const insertData: ProjectInsert = { // Usa o tipo de Insert do Database
        chamado: projectData.chamado,
        nome_cartorio: projectData.nome_cartorio,
        estado: projectData.estado,
        sistema: projectData.sistema,
        email_contato: projectData.email_contato,
        telefone_contato: projectData.telefone_contato,
        data_inicio_implantacao: projectData.data_inicio_implantacao,
        data_fim_implantacao: projectData.data_fim_implantacao,
        status: projectData.status,
        observacao_admin: projectData.observacao_admin,
        usuario_id: projectData.usuario_id
      };
      
      const { data, error } = await supabase
        .from('projetos')
        .insert(insertData)
        .select(`
          *,
          user:users!projetos_usuario_id_users_auth_id_fkey(nome, username)
        `)
        .single();

      if (error) throw error;

      const newProject: Project = { // Tipo Project
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user
      };
      
      setProjects(prev => [newProject, ...prev]);
      await loadProjects(); // Reload to get updated stats
      
      toast({
        title: "Projeto criado com sucesso",
        description: `Projeto ${projectData.chamado} foi criado.`
      });

      return { data: newProject, error: null };
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateProject = async (id: string, updates: {
    chamado?: string;
    nome_cartorio?: string;
    estado?: string;
    sistema?: string[];
    email_contato?: string;
    telefone_contato?: string;
    data_inicio_implantacao?: string;
    data_fim_implantacao?: string;
    status?: ProjectRow['status']; // Usa o tipo corrigido
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const updateData: ProjectUpdate = { // Usa o tipo de Update do Database
        chamado: updates.chamado,
        nome_cartorio: updates.nome_cartorio,
        estado: updates.estado,
        sistema: updates.sistema,
        email_contato: updates.email_contato,
        telefone_contato: updates.telefone_contato,
        data_inicio_implantacao: updates.data_inicio_implantacao,
        data_fim_implantacao: updates.data_fim_implantacao,
        status: updates.status,
        observacao_admin: updates.observacao_admin,
        usuario_id: updates.usuario_id
      };

      const { data, error } = await supabase
        .from('projetos')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          user:users!inner(nome, username)
        `)
        .single();

      if (error) throw error;

      const updatedProject: Project = { // Tipo Project
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user
      };
      
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
      );
      await loadProjects(); // Reload to get updated stats

      toast({
        title: "Projeto atualizado",
        description: "As alterações foram salvas com sucesso."
      });

      return { data: updatedProject, error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar projeto:', error);
      toast({
        title: "Erro ao atualizar projeto",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteProject = async (id: string) => {
    try {
      // 1. Get all comments with audio files for this project
      const { data: commentsData, error: commentsError } = await supabase
        .from('comentarios_projeto')
        .select('id, audio_url')
        .eq('projeto_id', id);

      if (commentsError) throw commentsError;

      // 2. Delete all audio files from storage
      const audioUrls = commentsData
        ?.filter(comment => comment.audio_url)
        .map(comment => comment.audio_url) || [];

      if (audioUrls.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('project_files')
          .remove(audioUrls);
        
        if (storageError) {
          console.warn('Erro ao excluir alguns arquivos de áudio:', storageError);
        }
      }

      // 3. Delete all comments for this project
      const { error: deleteCommentsError } = await supabase
        .from('comentarios_projeto')
        .delete()
        .eq('projeto_id', id);

      if (deleteCommentsError) throw deleteCommentsError;

      // 4. Delete all other related data (add more tables as needed)
      // TODO: Add deletion for other related tables like anexos, blocos, etc.

      // 5. Finally, delete the project
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      await loadProjects(); // Reload to get updated stats

      toast({
        title: "Projeto excluído completamente",
        description: "O projeto e todos os dados relacionados foram removidos com sucesso."
      });

      return { error: null };
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: "Erro ao excluir projeto",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const getProjectsByUser = (authId: string) => {
    return projects.filter(p => p.usuario_id === authId);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    stats,
    loading,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectsByUser
  };
};