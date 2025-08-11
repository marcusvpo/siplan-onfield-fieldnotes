import { useState, useEffect, useRef } from "react"; // Adicionado useRef
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Definir a URL do webhook do n8n aqui
// IMPORTANTE: Em produção, isto deve ser uma variável de ambiente (process.env.N8N_TRANSCRIBE_WEBHOOK_URL)
const N8N_TRANSCRIBE_WEBHOOK_URL = "SUA_URL_DO_WEBHOOK_AQUI"; // Substitua pela sua URL real

export interface ProjectComment {
  id: string;
  projeto_id: string;
  usuario_id: string | null; // Ajustado para ser nullable
  texto: string;
  created_at: string;
  updated_at: string;
  type: "text" | "audio"; // Adicionado tipo de comentário
  audio_url: string | null; // Adicionado URL do áudio no Storage
  user?: {
    nome: string;
    tipo: 'admin' | 'implantador';
  };
}

export const useProjectComments = (projectId?: string) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({}); // Guarda URLs assinadas dos áudios
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

      setComments(data as ProjectComment[]); // Casting para a interface atualizada

      // Pré-carrega URLs assinadas para áudios existentes
      const audioComments = (data as ProjectComment[]).filter(c => c.type === 'audio' && c.audio_url);
      const newAudioUrls: Record<string, string> = {};
      for (const comment of audioComments) {
        if (comment.audio_url) { // Verifica novamente se audio_url não é nulo
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

      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([{ 
          projeto_id: projectId,
          usuario_id: authUser.id,
          texto: texto.trim(),
          type: 'text', // Tipo de comentário: texto
          audio_url: null // Nulo para comentários de texto
        }])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data as ProjectComment]);
      
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

      // Upload do áudio para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false, // Não sobrescrever arquivos existentes
        });

      if (uploadError) throw uploadError;

      // Inserir o comentário na tabela comentarios_projeto
      const { data, error } = await supabase
        .from('comentarios_projeto')
        .insert([
          {
            projeto_id: projectId,
            usuario_id: authUser.id,
            type: 'audio', // Tipo de comentário: áudio
            audio_url: filePath, // Armazena o path relativo do Storage
            texto: 'Transcrição pendente...' // Texto inicial para transcrição futura
          }
        ])
        .select(`
          *,
          user:users!fk_comentarios_usuario_auth_id(nome, tipo)
        `)
        .single();

      if (error) throw error;

      // Adiciona a URL assinada ao estado para reprodução imediata
      const { data: signedUrlData } = await supabase.storage
        .from('project_files')
        .createSignedUrl(filePath, 60 * 60); // 1 hora de validade
      
      if (signedUrlData?.signedUrl) {
        setAudioUrls(prev => ({ ...prev, [data.id]: signedUrlData.signedUrl }));
      }


      // Dispara webhook do n8n para transcrição (se configurado)
      if (N8N_TRANSCRIBE_WEBHOOK_URL) {
        try {
          // Garante que a URL passada para o webhook seja a assinada para acesso externo
          await fetch(N8N_TRANSCRIBE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              comentario_id: (data as any)?.id, // ID do comentário recém-criado
              project_id: projectId,
              user_auth_id: authUser.id,
              audio_url: signedUrlData?.signedUrl ?? null, // URL assinada
              audio_path: filePath // Caminho interno no Storage
            })
          });
        } catch (err) {
          console.warn('Falha ao chamar webhook n8n:', err);
        }
      }

      setComments(prev => [...prev, data as ProjectComment]);
      
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
    addAudioComment, // <--- EXPORTADO
    audioUrls // <--- EXPORTADO
  };
};