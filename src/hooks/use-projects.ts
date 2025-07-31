import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  chamado: string;
  nome_cartorio: string;
  estado: string;
  sistema: string;
  email_contato: string;
  data_inicio_implantacao: string;
  data_fim_implantacao: string;
  status: "aguardando" | "em_andamento" | "finalizado" | "cancelado";
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
          user:users!inner(nome, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to ensure user is a single object, not array
      const projectsData = data?.map(project => ({
        ...project,
        user: Array.isArray(project.user) ? project.user[0] : project.user
      })) as Project[];
      
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
    sistema: string;
    email_contato: string;
    data_inicio_implantacao: string;
    data_fim_implantacao: string;
    status: "aguardando" | "em_andamento" | "finalizado" | "cancelado";
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const insertData = {
        chamado: projectData.chamado,
        nome_cartorio: projectData.nome_cartorio,
        estado: projectData.estado,
        sistema: projectData.sistema,
        email_contato: projectData.email_contato,
        data_inicio_implantacao: projectData.data_inicio_implantacao,
        data_fim_implantacao: projectData.data_fim_implantacao,
        status: projectData.status,
        observacao_admin: projectData.observacao_admin,
        usuario_id: projectData.usuario_id
      };
      
      const { data, error } = await supabase
        .from('projetos')
        .insert(insertData as any)
        .select(`
          *,
          user:users!inner(nome, username)
        `)
        .single();

      if (error) throw error;

      // Transform data to ensure user is a single object, not array
      const newProject = {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user
      } as Project;
      
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
    sistema?: string;
    email_contato?: string;
    data_inicio_implantacao?: string;
    data_fim_implantacao?: string;
    status?: "aguardando" | "em_andamento" | "finalizado" | "cancelado";
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .update(updates as any)
        .eq('id', id)
        .select(`
          *,
          user:users!inner(nome, username)
        `)
        .single();

      if (error) throw error;

      // Transform data to ensure user is a single object, not array
      const updatedProject = {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user
      } as Project;
      
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
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      await loadProjects(); // Reload to get updated stats

      toast({
        title: "Projeto excluído",
        description: "O projeto foi removido com sucesso."
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