import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { useProjects } from './use-projects';

// Usar o tipo FileObject do Supabase
type Report = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: any;
  projectId: string;
  projectName: string;
  fullPath: string;
};

export const useReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { projects } = useProjects();
  const { toast } = useToast();

  const loadReports = async () => {
    if (!user?.id || !projects.length) {
      setLoading(false);
      return;
    }

    try {
      console.log('[REPORTS] Carregando relatórios para usuário:', user.id);
      
      const allReports: Report[] = [];

      // Para cada projeto do usuário, busca relatórios
      for (const project of projects) {
        try {
          const { data: files, error } = await supabase.storage
            .from('relatorios')
            .list(`${user.id}/${project.id}`, {
              limit: 100,
              offset: 0
            });

          if (error) {
            console.warn(`[REPORTS] Erro ao listar relatórios do projeto ${project.id}:`, error);
            continue;
          }

          // Filtra apenas arquivos HTML e adiciona informações do projeto
          const htmlFiles = files?.filter(file => 
            file.name.toLowerCase().endsWith('.html') && 
            file.name !== '.emptyFolderPlaceholder'
          ).map(file => ({
            ...file,
            projectId: project.id,
            projectName: project.nome_cartorio,
            fullPath: `${user.id}/${project.id}/${file.name}`
          })) || [];

          allReports.push(...htmlFiles);
        } catch (projectError) {
          console.warn(`[REPORTS] Erro ao processar projeto ${project.id}:`, projectError);
        }
      }

      console.log('[REPORTS] Total de relatórios encontrados:', allReports.length);
      setReports(allReports);

    } catch (error) {
      console.error('[REPORTS] Erro inesperado:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (report: Report) => {
    if (!user?.id) return;

    try {
      console.log('[REPORTS] Baixando relatório:', report.fullPath);
      
      const { data, error } = await supabase.storage
        .from('relatorios')
        .download(report.fullPath);

      if (error) {
        console.error('[REPORTS] Erro ao baixar relatório:', error);
        toast({
          title: "Erro",
          description: "Não foi possível baixar o relatório",
          variant: "destructive"
        });
        return;
      }

      // Cria um blob e faz o download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Relatório baixado com sucesso!",
        variant: "default"
      });

    } catch (error) {
      console.error('[REPORTS] Erro inesperado no download:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao baixar relatório",
        variant: "destructive"
      });
    }
  };

  const getReportUrl = async (report: Report) => {
    if (!user?.id) return null;

    try {
      const { data } = supabase.storage
        .from('relatorios')
        .getPublicUrl(report.fullPath);

      return data.publicUrl;
    } catch (error) {
      console.error('[REPORTS] Erro ao obter URL do relatório:', error);
      return null;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Tamanho não disponível';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Data não disponível';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (user?.id && projects.length > 0) {
      loadReports();
    }
  }, [user?.id, projects.length]);

  return {
    reports,
    loading,
    loadReports,
    downloadReport,
    getReportUrl,
    formatFileSize,
    formatDate
  };
};