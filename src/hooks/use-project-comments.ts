import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// Definir a URL do webhook do n8n aqui
// IMPORTANTE: Em produção, isto deve ser uma variável de ambiente (process.env.N8N_TRANSCRIBE_WEBHOOK_URL)
const N8N_TRANSCRIBE_WEBHOOK_URL = "SUA_URL_DO_WEBHOOK_AQUI"; // Substitua pela sua URL real

// Definir o tipo da linha de usuário do banco de dados
type UserRow = Database['public']['Tables']['users']['Row'];
type ComentarioRow = Database['public']['Tables']['comentarios_projeto']['Row'];
type ComentarioInsert = Database['public']['Tables']['comentarios_projeto']['Insert'];

export interface ProjectComment {
  id: string;
  projeto_id: string;
  usuario_id: string | null;
  texto: string;
  created_at: string;
  updated_at: string;
  type: "text" | "audio";
  audio_url: string | null;
  user: { // user pode ser null se o usuario_id for null ou o join não encontrar
    nome: string;
    tipo: UserRow['tipo']; // Usa o tipo corrigido de 'tipo'
  } | null;
}

export const useProjectComments = (projectId?: string) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
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

      const fetchedComments: ProjectComment[] = data.map((comment: ComentarioRow & { user: UserRow | null }) => ({ // Cast explícito aqui
        ...comment,
        user: comment.user ? {
          nome: comment.user.nome,
          tipo: comment.user.tipo, // 'tipo' agora é inferido corretamente
        } : null,
        type: comment.type as "text" | "audio", // Garantir o tipo correto para 'type'
      }));

      setComments(fetchedComments);

      // Pré-carrega URLs assinadas para áudios existentes
      const audioComments = fetchedComments.filter(c => c.type === 'audio' && c.audio_url);
      const newAudioUrls: Record<string, string> = {};
      for (const comment of audioComments) {
        if (comment.audio_url) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('project_files')
            .createSignedUrl(comment.audio_url, 60 * 60);

          if (!signedUrlError && signedUrlData?.signedUrl) {
            newAudioUrls[comment.id] = signedUrlData.signedUrl;
          } else {
            console.error(`Erro ao gerar URL assinada para ${comment.audio_url}:`, signedUrlError);
          }
        }
      }
      setAudioUrls(newAudioUrls);

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
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Usuário não autenticado.");
      }

      const insertData: ComentarioInsert = {
        projeto_id: projectId,
        usuario_id: authUser.id,
        texto: texto.trim(),
        type: 'text',
        audio_url: null
      };

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([insertData])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .single();

      if (error) throw error;

      const newComment: ProjectComment = { // Tipo ProjectComment
        ...data,
        user: data.user ? {
          nome: data.user.nome,
          tipo: data.user.tipo, // 'tipo' é inferido corretamente
        } : null,
        type: data.type as "text" | "audio",
      };

      setComments(prev => [...prev, newComment]);
      
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

      const insertData: ComentarioInsert = {
        projeto_id: projectId,
        usuario_id: authUser.id,
        type: 'audio',
        audio_url: filePath,
        texto: 'Transcrição pendente...'
      };

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([insertData])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .single();

      if (error) throw error;

      const { data: signedUrlData } = await supabase.storage
        .from('project_files')
        .createSignedUrl(filePath, 60 * 60);
      
      if (signedUrlData?.signedUrl) {
        setAudioUrls(prev => ({ ...prev, [data.id]: signedUrlData.signedUrl }));
      }

      const newComment: ProjectComment = { // Tipo ProjectComment
        ...data,
        user: data.user ? {
          nome: data.user.nome,
          tipo: data.user.tipo, // 'tipo' é inferido corretamente
        } : null,
        type: data.type as "text" | "audio",
      };

      if (N8N_TRANSCRIBE_WEBHOOK_URL) {
        try {
          await fetch(N8N_TRANSCRIBE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              comentario_id: newComment.id,
              project_id: projectId,
              user_auth_id: authUser.id,
              audio_url: signedUrlData?.signedUrl ?? null,
              audio_path: filePath
            })
          });
        } catch (err) {
          console.warn('Falha ao chamar webhook n8n:', err);
        }
      }

      setComments(prev => [...prev, newComment]);
      
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
    addComment,
    addAudioComment,
    audioUrls
  };
};