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
  data_agendada: string;
  data_inicio_implantacao?: string;
  data_fim_implantacao?: string;
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
          user:users(nome, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsData = data as Project[];
      setProjects(projectsData);

      // Calculate stats
      const now = new Date();
      const statsData = {
        total: projectsData.length,
        ativos: projectsData.filter(p => p.status === 'em_andamento').length,
        concluidos: projectsData.filter(p => p.status === 'finalizado').length,
        atrasados: projectsData.filter(p => {
          const dataAgendada = new Date(p.data_agendada);
          return p.status !== 'finalizado' && dataAgendada < now;
        }).length,
        agendados: projectsData.filter(p => p.status === 'aguardando').length
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
    data_agendada?: string;
    data_inicio_implantacao: string;
    data_fim_implantacao: string;
    status: "aguardando" | "em_andamento" | "finalizado" | "cancelado";
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .insert([projectData])
        .select(`
          *,
          user:users(nome, username)
        `)
        .single();

      if (error) throw error;

      const newProject = data as Project;
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
    sistema?: "Orion PRO" | "Orion REG" | "Orion TN" | "WebRI";
    email_contato?: string;
    data_agendada?: string;
    status?: "aguardando" | "em_andamento" | "finalizado" | "cancelado";
    observacao_admin?: string;
    usuario_id?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          user:users(nome, username)
        `)
        .single();

      if (error) throw error;

      const updatedProject = data as Project;
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

  const getProjectsByUser = (userId: string) => {
    return projects.filter(p => p.usuario_id === userId);
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