import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProjectComment {
  id: string;
  projeto_id: string;
  usuario_id: string;
  texto: string;
  created_at: string;
  updated_at: string;
  user?: {
    nome: string;
    tipo: 'admin' | 'implantador';
  };
}

export const useProjectComments = (projectId?: string) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadComments = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comentarios_projeto')
        .select(`
          *,
          user:users(nome, tipo)
        `)
        .eq('projeto_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setComments(data as any);
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error);
      toast({
        title: "Erro ao carregar comentários",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (texto: string): Promise<boolean> => {
    if (!projectId || !texto.trim()) return false;

    try {
      // Get current user ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError) throw userError;

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([{
          projeto_id: projectId,
          usuario_id: userData.id,
          texto: texto.trim()
        }])
        .select(`
          *,
          user:users(nome, tipo)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data as any]);
      
      toast({
        title: "Comentário adicionado",
        description: "Sua observação foi registrada com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao adicionar comentário",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    loadComments();
  }, [projectId]);

  return {
    comments,
    loading,
    loadComments,
    addComment
  };
};