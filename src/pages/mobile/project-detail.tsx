import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { useProjectComments } from "@/hooks/use-project-comments";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

// Configuração do webhook n8n para geração de relatório
const N8N_WEBHOOK_URL = "https://77350e4f45d1.ngrok-free.app/webhook-test/gerar-relatorio";
import { 
  Mic, 
  MicOff,
  Send,
  Calendar,
  MapPin,
  ChevronDown,
  MoreVertical,
  ChevronUp,
  Loader2,
  X,
  FileText
} from "lucide-react";

interface ProjectComment {
  id: string;
  texto: string;
  audio_url?: string;
  type: 'text' | 'audio';
  created_at: string;
  user: {
    nome: string;
    tipo: string;
  } | null;
}

export const MobileProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, updateProject } = useProjects();
  const { comments, loading: commentsLoading, addComment, addAudioComment, deleteComment, audioUrls } = useProjectComments(id);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [expandedTranscriptions, setExpandedTranscriptions] = useState<Record<string, boolean>>({});
  const [transcriptionStatuses, setTranscriptionStatuses] = useState<Record<string, 'pending' | 'completed'>>({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'ready_to_send'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordButtonRef = useRef<HTMLButtonElement>(null);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (projects.length > 0) {
      setLoading(false);
    }
  }, [projects]);

  // Realtime subscription for transcription updates
  useEffect(() => {
    if (!id) return;

    console.log('Setting up realtime subscription for project:', id);
    const channel = supabase
      .channel('comentarios-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comentarios_projeto',
          filter: `projeto_id=eq.${id}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          const updatedComment = payload.new as any;
          
          // Só considera completa se for áudio E tem texto E o texto tem mais que 10 caracteres
          // (para evitar textos muito curtos que podem ser placeholders)
          if (updatedComment.type === 'audio' && 
              updatedComment.texto && 
              updatedComment.texto.trim().length > 10) {
            console.log('Transcription completed for comment:', updatedComment.id, 'Text length:', updatedComment.texto.length);
            setTranscriptionStatuses(prev => ({
              ...prev,
              [updatedComment.id]: 'completed'
            }));
          } else {
            console.log('Transcription still pending for comment:', updatedComment.id, 'Text:', updatedComment.texto);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Initialize transcription statuses when comments load
  useEffect(() => {
    console.log('Initializing transcription statuses for comments:', comments.length);
    const statuses: Record<string, 'pending' | 'completed'> = {};
    comments.forEach(comment => {
      if (comment.type === 'audio') {
        // Só considera completo se tem texto com pelo menos 10 caracteres
        const isCompleted = comment.texto && comment.texto.trim().length > 10;
        statuses[comment.id] = isCompleted ? 'completed' : 'pending';
        console.log('Comment', comment.id, 'status:', isCompleted ? 'completed' : 'pending', 'text length:', comment.texto?.length || 0);
      }
    });
    setTranscriptionStatuses(statuses);
  }, [comments]);

  // Polling para verificar transcrições pendentes - verifica a cada 3 segundos
  useEffect(() => {
    const pendingTranscriptions = Object.entries(transcriptionStatuses)
      .filter(([_, status]) => status === 'pending')
      .map(([id]) => id);

    console.log('Pending transcriptions:', pendingTranscriptions);
    if (pendingTranscriptions.length === 0) return;

    const interval = setInterval(async () => {
      console.log('Polling for transcription updates...');
      const { data, error } = await supabase
        .from('comentarios_projeto')
        .select('id, texto')
        .in('id', pendingTranscriptions);

      if (error) {
        console.error('Error polling transcriptions:', error);
        return;
      }

      if (data) {
        data.forEach(comment => {
          // Só considera completo se tem texto com pelo menos 10 caracteres
          if (comment.texto && comment.texto.trim().length > 10) {
            console.log('Polling detected completed transcription for:', comment.id, 'Text length:', comment.texto.length);
            setTranscriptionStatuses(prev => ({
              ...prev,
              [comment.id]: 'completed'
            }));
          } else {
            console.log('Polling: transcription still pending for:', comment.id, 'Text length:', comment.texto?.length || 0);
          }
        });
      }
    }, 3000); // Verifica a cada 3 segundos

    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(interval);
    };
  }, [transcriptionStatuses]);

  // Função para formatar tempo (usado no cronômetro de gravação e duração do áudio)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para agrupar comentários por dia
  const groupedComments = comments.reduce((acc: Record<string, typeof comments>, comment) => {
    const dateKey = new Date(comment.created_at).toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(comment);
    return acc;
  }, {});

  const handleRecordClick = () => {
    console.log('handleRecordClick called, current state:', recordingState);
    if (recordingState === 'idle') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopAndSendRecording();
    }
  };

  const handleCancelRecording = () => {
    console.log('handleCancelRecording called');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      const stream = mediaRecorderRef.current.stream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    setIsRecording(false);
    setRecordingState('idle');
    setRecordingTime(0);
    toast({
      title: "Gravação cancelada",
      description: "A gravação foi cancelada."
    });
  };

  // Função legacy para compatibilidade (não deve ser usada)
  const handleRecordStart = () => {
    console.warn('handleRecordStart chamado - função obsoleta');
    handleRecordClick();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = []; // Limpa chunks anteriores

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Função será chamada quando parar a gravação
        stream.getTracks().forEach(track => track.stop()); // Encerra o microfone
      };

      mediaRecorderRef.current.onstart = () => {
        setIsRecording(true);
        setRecordingState('recording');
        setRecordingTime(0);
        // Inicia o cronômetro visual
        const timer = setInterval(() => {
          setRecordingTime(prev => prev + 1);
          if (mediaRecorderRef.current?.state === 'inactive') {
            clearInterval(timer);
          }
        }, 1000);
      };

      mediaRecorderRef.current.start();
    } catch (error: any) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro ao acessar microfone",
        description: error.message || "Verifique as permissões do microfone.",
        variant: "destructive"
      });
    }
  };

  const stopAndSendRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      // Aguarda um pouco para garantir que os dados foram coletados
      setTimeout(async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsAddingComment(true);
        const success = await addAudioComment(audioBlob);
        setIsAddingComment(false);
        setIsRecording(false);
        setRecordingState('idle');
        setRecordingTime(0);
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false); // Garante que o estado de gravação seja atualizado
    }
  };

  const handleSendTextComment = async () => {
    if (!newText.trim() || !project) return;
    
    setIsAddingComment(true);
    const success = await addComment(newText.trim());
    
    if (success) {
      setNewText("");
    }
    
    setIsAddingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      toast({
        title: "Comentário excluído",
        description: "O comentário foi removido com sucesso."
      });
    }
  };

  const toggleTranscription = (commentId: string) => {
    setExpandedTranscriptions(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleGenerateReport = async () => {
    if (!project) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Requisição para o webhook n8n
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: project.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Se o webhook retornou uma URL do PDF
        if (result.pdf_url) {
          toast({
            title: "Relatório gerado com sucesso!",
            description: "O relatório foi criado e será aberto em uma nova aba."
          });
          
          // Abrir o PDF automaticamente em uma nova aba
          window.open(result.pdf_url, '_blank');
        } else {
          // Sucesso genérico se não houver URL
          toast({
            title: "Relatório em processamento",
            description: "O relatório está sendo gerado. Você será notificado quando estiver pronto."
          });
        }
      } else {
        // Erro HTTP
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      
      // Tratamento de diferentes tipos de erro
      let errorMessage = "Não foi possível gerar o relatório.";
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = "Erro de conexão com o servidor. Verifique sua conexão com a internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      "em_andamento": "bg-info text-white",
      "aguardando": "bg-warning text-white", 
      "finalizado": "bg-success text-white",
      "cancelado": "bg-destructive text-white"
    };
    return colors[status as keyof typeof colors] || "bg-medium-gray text-white";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      "em_andamento": "Em Andamento",
      "aguardando": "Agendado",
      "finalizado": "Concluído", 
      "cancelado": "Cancelado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading || commentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wine-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
        <Header 
          userType="implantador" 
          userName={user?.nome || "Implantador"}
          onLogout={signOut}
          showBackButton={true}
        />
      </div>

      {/* Fixed Project Info */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-border">
        <div className="p-4">
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-medium-gray">{project?.chamado}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(project?.status || '')}>
                  {getStatusLabel(project?.status || '')}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <ChevronDown className={`h-4 w-4 transform transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent>
              <h1 className="text-lg font-bold text-dark-gray mb-1">
                {project?.nome_cartorio}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-medium-gray">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{project ? `${new Date(project.data_inicio_implantacao).toLocaleDateString('pt-BR')} - ${new Date(project.data_fim_implantacao).toLocaleDateString('pt-BR')}` : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{project ? (Array.isArray(project.sistema) ? project.sistema.join(', ') : project.sistema) : ''}</span>
                </div>
              </div>
              {project?.observacao_admin && (
                <div className="mt-3 p-2 bg-wine-red-light rounded-lg">
                  <p className="text-xs text-wine-red font-medium">Observação do Admin:</p>
                  <p className="text-sm text-dark-gray">{project.observacao_admin}</p>
                </div>
              )}

              {/* Gerar Relatório Button */}
              <div className="mt-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="wine" 
                      size="sm" 
                      className="w-full"
                      disabled={project?.status === 'finalizado' || isGeneratingReport}
                    >
                      {isGeneratingReport ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-2 h-4 w-4" />
                      )}
                      {isGeneratingReport ? "Gerando Relatório..." : "Gerar Relatório Final"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar geração de relatório</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja gerar o relatório final deste projeto? 
                        Certifique-se de que toda a implantação está 100% finalizada antes de prosseguir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isGeneratingReport}>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport}
                        className="bg-wine-red text-white hover:bg-wine-red-hover disabled:opacity-50"
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          "Gerar Relatório"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      
      {/* Scrollable Chat Content */}
      <main className="flex-1 overflow-y-auto" style={{ marginTop: detailsOpen ? '280px' : '160px', paddingBottom: '80px' }}>
        <div className="p-4">
        {/* Comments/Timeline */}
        {Object.keys(groupedComments).length > 0 ? (
          Object.entries(groupedComments)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dayComments]) => (
              <div key={date} className="mb-6">
                <div className="text-center mb-4">
                  <div className="inline-block bg-light-gray px-3 py-1 rounded-full text-xs text-medium-gray">
                    {new Date(date).toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  {dayComments
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((comment, index) => (
                      <Card key={comment.id} className="shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-medium-gray">
                                  <span className="font-medium">{comment.user?.nome || "Usuário"}</span>
                                  <span className="mx-1">•</span>
                                  <span>{new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                          Deletar
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja excluir este comentário? Esta ação é irreversível.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Excluir
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            {comment.type === 'audio' ? (
                              <div className="bg-wine-red-light p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <audio controls src={audioUrls[comment.id]} className="w-full">
                                    Seu navegador não suporta o elemento de áudio.
                                  </audio>
                                </div>

                                {/* Transcription Status */}
                                <div className="mt-2">
                                  {transcriptionStatuses[comment.id] === 'pending' ? (
                                    <div className="flex items-center gap-2 text-sm text-medium-gray">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      <span>Transcrevendo áudio...</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleTranscription(comment.id)}
                                        className="text-xs p-1 h-auto text-wine-red hover:text-wine-red-hover"
                                      >
                                        {expandedTranscriptions[comment.id] ? (
                                          <>
                                            <ChevronUp className="mr-1 h-3 w-3" />
                                            Ocultar transcrição
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="mr-1 h-3 w-3" />
                                            Ver transcrição
                                          </>
                                        )}
                                      </Button>
                                      
                                       {expandedTranscriptions[comment.id] && (
                                         <div className="mt-2 p-2 bg-white/50 rounded border text-sm text-dark-gray">
                                           {comment.texto && comment.texto.trim().length > 10 
                                             ? comment.texto 
                                             : "Aguardando transcrição..."}
                                         </div>
                                       )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-light-gray p-3 rounded-lg">
                                <p className="text-sm text-dark-gray">{comment.texto}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum histórico de atividades para este projeto.
          </div>
        )}
        </div>
      </main>

      {/* Fixed Bottom Actions - Layout WhatsApp-like */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-3 flex items-end gap-2">
        {/* Campo de texto (Textarea) */}
        <Textarea
          placeholder={isRecording ? `Gravando... ${formatTime(recordingTime)}` : "Adicionar observação..."}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 resize-none min-h-[40px] max-h-32 text-base rounded-full py-2 px-4 shadow-inner"
          rows={1}
          disabled={isRecording} // Desabilita o textarea durante a gravação
        />
        
        {/* Botões de ação */}
        {newText.trim() ? (
          <Button 
            size="icon"
            className="h-10 w-10 rounded-full bg-wine-red hover:bg-wine-red-hover shrink-0"
            disabled={isAddingComment}
            onClick={handleSendTextComment}
          >
            {isAddingComment ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <div className="flex items-end gap-2">
            {/* Botão de cancelar (só aparece durante gravação) */}
            {isRecording && (
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-destructive hover:bg-destructive/90 shrink-0"
                onClick={handleCancelRecording}
                disabled={isAddingComment}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
            
            {/* Botão de gravar/enviar áudio */}
            <Button
              ref={recordButtonRef}
              size="icon"
              className={`h-10 w-10 rounded-full shrink-0 transition-all duration-200 ${
                isRecording 
                  ? "bg-wine-red hover:bg-wine-red-hover animate-pulse"
                  : "bg-wine-red hover:bg-wine-red-hover"
              }`}
              onClick={handleRecordClick}
              aria-label={isRecording ? "Enviar gravação" : "Iniciar gravação"}
              disabled={isAddingComment}
            >
              {isAddingComment ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <Send className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileProjectDetail;