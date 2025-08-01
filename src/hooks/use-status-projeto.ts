import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StatusProjeto {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useStatusProjeto = () => {
  const [statusList, setStatusList] = useState<StatusProjeto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('status_projeto')
        .select('*')
        .order('ordem');

      if (error) {
        console.error('Erro ao buscar status:', error);
        toast.error('Erro ao carregar status');
        return;
      }

      setStatusList(data || []);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  };

  const createStatus = async (data: { nome: string; cor: string; ordem: number; ativo: boolean }) => {
    try {
      const { error } = await supabase
        .from('status_projeto')
        .insert([data]);

      if (error) {
        console.error('Erro ao criar status:', error);
        toast.error('Erro ao criar status');
        return false;
      }

      toast.success('Status criado com sucesso');
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Erro ao criar status:', error);
      toast.error('Erro ao criar status');
      return false;
    }
  };

  const updateStatus = async (id: string, data: { nome: string; cor: string; ordem: number; ativo: boolean }) => {
    try {
      const { error } = await supabase
        .from('status_projeto')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
        return false;
      }

      toast.success('Status atualizado com sucesso');
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('status_projeto')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir status:', error);
        toast.error('Erro ao excluir status');
        return false;
      }

      toast.success('Status excluído com sucesso');
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Erro ao excluir status:', error);
      toast.error('Erro ao excluir status');
      return false;
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    statusList,
    loading,
    createStatus,
    updateStatus,
    deleteStatus,
    refetch: fetchStatus
  };
};