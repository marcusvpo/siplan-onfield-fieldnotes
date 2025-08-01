import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AtividadeRecente {
  id: string;
  projeto_id: string;
  usuario_id: string;
  acao: string;
  descricao: string;
  created_at: string;
  user?: {
    nome: string;
  };
  projeto?: {
    nome_cartorio: string;
  };
}

export const useAtividadesRecentes = () => {
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAtividades = async () => {
    try {
      const { data, error } = await supabase
        .from('atividades_recentes')
        .select(`
          *,
          user:users!atividades_recentes_usuario_id_fkey(nome),
          projeto:projetos!atividades_recentes_projeto_id_fkey(nome_cartorio)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar atividades:', error);
        toast.error('Erro ao carregar atividades recentes');
        return;
      }

      setAtividades(data || []);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      toast.error('Erro ao carregar atividades recentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtividades();
  }, []);

  return {
    atividades,
    loading,
    refetch: fetchAtividades
  };
};