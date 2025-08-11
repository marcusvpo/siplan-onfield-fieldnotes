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
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
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
      // Obter o usuário autenticado (auth_id)
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Usuário não autenticado.");
      }

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([{ 
          projeto_id: projectId,
          usuario_id: authUser.id, // usar auth_id diretamente
          texto: texto.trim()
        }])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
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