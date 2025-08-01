import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Sistema {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSistemas = () => {
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSistemas = async () => {
    try {
      const { data, error } = await supabase
        .from('sistemas')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar sistemas:', error);
        toast.error('Erro ao carregar sistemas');
        return;
      }

      setSistemas(data || []);
    } catch (error) {
      console.error('Erro ao buscar sistemas:', error);
      toast.error('Erro ao carregar sistemas');
    } finally {
      setLoading(false);
    }
  };

  const createSistema = async (data: { nome: string; ativo: boolean }) => {
    try {
      const { error } = await supabase
        .from('sistemas')
        .insert([data]);

      if (error) {
        console.error('Erro ao criar sistema:', error);
        toast.error('Erro ao criar sistema');
        return false;
      }

      toast.success('Sistema criado com sucesso');
      await fetchSistemas();
      return true;
    } catch (error) {
      console.error('Erro ao criar sistema:', error);
      toast.error('Erro ao criar sistema');
      return false;
    }
  };

  const updateSistema = async (id: string, data: { nome: string; ativo: boolean }) => {
    try {
      const { error } = await supabase
        .from('sistemas')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar sistema:', error);
        toast.error('Erro ao atualizar sistema');
        return false;
      }

      toast.success('Sistema atualizado com sucesso');
      await fetchSistemas();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar sistema:', error);
      toast.error('Erro ao atualizar sistema');
      return false;
    }
  };

  const deleteSistema = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sistemas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir sistema:', error);
        toast.error('Erro ao excluir sistema');
        return false;
      }

      toast.success('Sistema excluído com sucesso');
      await fetchSistemas();
      return true;
    } catch (error) {
      console.error('Erro ao excluir sistema:', error);
      toast.error('Erro ao excluir sistema');
      return false;
    }
  };

  useEffect(() => {
    fetchSistemas();
  }, []);

  return {
    sistemas,
    loading,
    createSistema,
    updateSistema,
    deleteSistema,
    refetch: fetchSistemas
  };
};