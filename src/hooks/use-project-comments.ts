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
  type: "text" | "audio" | "image";
  audio_url: string | null;
  image_url: string | null;
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
      // O Supabase retorna `null` para relações não encontradas. Precisamos garantir a tipagem.
      const { data, error } = await supabase
        .from('comentarios_projeto')
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .eq('projeto_id', projectId);

      if (error) throw error;

      // Realiza um cast mais forte para `any` na data, e depois mapeia para o tipo correto.
      // Isso contorna a dificuldade do TS em tipar a resposta aninhada do Supabase em tempo de compilação.
      const fetchedComments: ProjectComment[] = (data as any[]).map((comment: any) => ({
        ...comment,
        user: comment.user ? {
          nome: comment.user.nome,
          tipo: comment.user.tipo,
        } : null,
        type: comment.type as "text" | "audio" | "image",
      }));

      setComments(fetchedComments);

      // Pré-carrega URLs assinadas para áudios existentes
      const audioComments = fetchedComments.filter(c => c.type === 'audio' && c.audio_url);
      const newAudioUrls: Record<string, string> = {};
      for (const comment of audioComments) {
        if (comment.audio_url) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('project_files')
            .createSignedUrl(comment.audio_url, 60 * 60); // URL válida por 1 hora

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

      // Realiza um cast mais forte para `any` na data, e depois mapeia para o tipo correto.
      const newComment: ProjectComment = {
        ...data as any, // Cast a data como any antes de remapear
        user: (data as any).user ? {
          nome: (data as any).user.nome,
          tipo: (data as any).user.tipo,
        } : null,
        type: data.type as "text" | "audio" | "image",
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

  const deleteComment = async (commentId: string): Promise<boolean> => {
    try {
      // Get the comment to check for audio file
      const commentToDelete = comments.find(c => c.id === commentId);
      
      // Delete audio file from storage if it exists
      if (commentToDelete?.type === 'audio' && commentToDelete.audio_url) {
        const { error: storageError } = await supabase.storage
          .from('project_files')
          .remove([commentToDelete.audio_url]);
        
        if (storageError) {
          console.warn('Erro ao excluir arquivo de áudio:', storageError);
        }
      }

      // Delete comment from database
      const { error } = await supabase
        .from('comentarios_projeto')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Remove from audio URLs cache
      setAudioUrls(prev => {
        const updated = { ...prev };
        delete updated[commentId];
        return updated;
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir comentário:', error);
      toast({
        title: "Erro ao excluir comentário",
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
        .createSignedUrl(filePath, 60 * 60); // 1 hora de validade
      
      if (signedUrlData?.signedUrl) {
        setAudioUrls(prev => ({ ...prev, [data.id]: signedUrlData.signedUrl }));
      }

      // Realiza um cast mais forte para `any` na data, e depois mapeia para o tipo correto.
      const newComment: ProjectComment = {
        ...data as any, // Cast a data como any antes de remapear
        user: (data as any).user ? {
          nome: (data as any).user.nome,
          tipo: (data as any).user.tipo,
        } : null,
        type: data.type as "text" | "audio" | "image",
      };

      // Simular transcrição para teste (remover quando tiver transcrição real)
      setTimeout(async () => {
        await supabase
          .from('comentarios_projeto')
          .update({ texto: `Transcrição simulada do áudio enviado em ${new Date().toLocaleTimeString()}` })
          .eq('id', data.id);
      }, 5000);

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

  const addImageComment = async (file: File): Promise<boolean> => {
    if (!projectId) return false;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuário não autenticado.");

      const filePath = `projetos/${projectId}/anexos/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const insertData: ComentarioInsert = {
        projeto_id: projectId,
        usuario_id: authUser.id,
        type: 'image',
        image_url: filePath,
        texto: file.name
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

      // Realiza um cast mais forte para `any` na data, e depois mapeia para o tipo correto.
      const newComment: ProjectComment = {
        ...data as any, // Cast a data como any antes de remapear
        user: (data as any).user ? {
          nome: (data as any).user.nome,
          tipo: (data as any).user.tipo,
        } : null,
        type: data.type as "text" | "audio" | "image",
      };

      setComments(prev => [...prev, newComment]);
      
      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso."
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: "Erro ao enviar imagem",
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
    addImageComment,
    deleteComment,
    audioUrls
  };
};