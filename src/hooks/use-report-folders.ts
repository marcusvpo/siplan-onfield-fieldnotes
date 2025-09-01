import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useReportFolders = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createUserFolder = async (userId: string) => {
    try {
      await supabase.functions.invoke('manage-report-folders', {
        body: { action: 'create_user_folder', user_id: userId }
      });
      console.log('[REPORT FOLDERS] User folder created:', userId);
    } catch (error) {
      console.error('[REPORT FOLDERS] Error creating user folder:', error);
      throw error;
    }
  };

  const createProjectFolder = async (userId: string, projectId: string) => {
    try {
      await supabase.functions.invoke('manage-report-folders', {
        body: { action: 'create_project_folder', user_id: userId, project_id: projectId }
      });
      console.log('[REPORT FOLDERS] Project folder created:', { userId, projectId });
    } catch (error) {
      console.error('[REPORT FOLDERS] Error creating project folder:', error);
      throw error;
    }
  };

  const cleanupProject = async (userId: string, projectId: string) => {
    try {
      await supabase.functions.invoke('manage-report-folders', {
        body: { action: 'cleanup_project', user_id: userId, project_id: projectId }
      });
      console.log('[REPORT FOLDERS] Project cleaned:', { userId, projectId });
    } catch (error) {
      console.error('[REPORT FOLDERS] Error cleaning project:', error);
      throw error;
    }
  };

  const moveProject = async (oldUserId: string, newUserId: string, projectId: string) => {
    try {
      await supabase.functions.invoke('manage-report-folders', {
        body: { action: 'move_project', old_user_id: oldUserId, user_id: newUserId, project_id: projectId }
      });
      console.log('[REPORT FOLDERS] Project moved:', { oldUserId, newUserId, projectId });
    } catch (error) {
      console.error('[REPORT FOLDERS] Error moving project:', error);
      throw error;
    }
  };

  const runBackfill = async () => {
    try {
      setLoading(true);
      
      await supabase.functions.invoke('manage-report-folders', {
        body: { action: 'backfill' }
      });
      
      toast({
        title: "Backfill concluído",
        description: "Todas as pastas de relatórios foram criadas com sucesso."
      });
      
      console.log('[REPORT FOLDERS] Backfill completed');
    } catch (error: any) {
      console.error('[REPORT FOLDERS] Error in backfill:', error);
      toast({
        title: "Erro no backfill",
        description: error.message || "Erro ao criar pastas de relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createUserFolder,
    createProjectFolder,
    cleanupProject,
    moveProject,
    runBackfill
  };
};