import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// URL do webhook do n8n (preencha para ativar a transcrição automática)
const N8N_TRANSCRIBE_WEBHOOK_URL = "";

export interface ProjectComment {
  id: string;
  projeto_id: string;
  usuario_id: string | null;
  texto: string;
  type: 'text' | 'audio';
  audio_url: string | null;
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

  const addAudioComment = async (audioBlob: Blob): Promise<boolean> => {
    if (!projectId) return false;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuário não autenticado.");

      const filePath = `projetos/${projectId}/audios/${Date.now()}_${authUser.id}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([
          {
            projeto_id: projectId,
            usuario_id: authUser.id,
            type: 'audio',
            audio_url: filePath, // armazenamos o path no storage (bucket privado)
            texto: 'Transcrição pendente...'
          }
        ])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Dispara webhook do n8n (se configurado)
      if (N8N_TRANSCRIBE_WEBHOOK_URL) {
        try {
          const { data: signed } = await supabase.storage
            .from('project_files')
            .createSignedUrl(filePath, 60 * 60); // 1h

          await fetch(N8N_TRANSCRIBE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              comentario_id: (data as any)?.id,
              project_id: projectId,
              user_auth_id: authUser.id,
              audio_url: signed?.signedUrl ?? null,
              audio_path: filePath
            })
          });
        } catch (err) {
          console.warn('Falha ao chamar webhook n8n:', err);
        }
      }

      setComments(prev => [...prev, data as any]);

      toast({
        title: "Áudio enviado",
        description: "Seu áudio foi enviado e a transcrição será processada."
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      toast({
        title: "Erro ao enviar áudio",
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