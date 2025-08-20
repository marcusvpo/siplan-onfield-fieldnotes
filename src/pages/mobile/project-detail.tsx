import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { useProjectComments } from "@/hooks/use-project-comments";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mic, 
  MicOff,
  Play, 
  Pause,
  Send,
  Paperclip,
  Calendar,
  MapPin,
  FileText,
  Image as ImageIcon,
  ArrowLeft,
  ChevronDown,
  MoreVertical,
  Trash2,
  ChevronUp,
  Loader2
} from "lucide-react";

// Removendo mockTimeline e getActivityIcon, pois agora usaremos dados reais e ícones do tipo
// const mockTimeline = [...]; // REMOVIDO

export const MobileProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading, updateProject } = useProjects(); // Adicionado updateProject para status
  const { 
    comments, 
    loading: commentsLoading, 
    addComment, 
    addAudioComment,
    deleteComment,
    audioUrls
  } = useProjectComments(id);
  const { toast } = useToast();
  
  const [newText, setNewText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [expandedTranscriptions, setExpandedTranscriptions] = useState<Record<string, boolean>>({});
  const [transcriptionStatuses, setTranscriptionStatuses] = useState<Record<string, 'pending' | 'completed'>>({});

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (!loading && !project) {
      toast({
        title: "Projeto não encontrado",
        description: "O projeto solicitado não foi encontrado.",
        variant: "destructive"
      });
      navigate('/mobile');
    }
  }, [project, loading, navigate, toast]);

  // Realtime subscription for transcription updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comentarios_projeto',
          filter: `projeto_id=eq.${id}`
        },
        (payload) => {
          const updatedComment = payload.new as any;
          if (updatedComment.type === 'audio' && updatedComment.texto !== 'Transcrição pendente...') {
            setTranscriptionStatuses(prev => ({
              ...prev,
              [updatedComment.id]: 'completed'
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Initialize transcription statuses when comments load
  useEffect(() => {
    const statuses: Record<string, 'pending' | 'completed'> = {};
    comments.forEach(comment => {
      if (comment.type === 'audio') {
        statuses[comment.id] = comment.texto === 'Transcrição pendente...' ? 'pending' : 'completed';
      }
    });
    setTranscriptionStatuses(statuses);
  }, [comments]);

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsAddingComment(true);
        await addAudioComment(audioBlob); // Chama a função do hook
        setIsAddingComment(false);
        stream.getTracks().forEach(track => track.stop()); // Encerra o microfone
      };

      mediaRecorderRef.current.onstart = () => {
        setIsRecording(true);
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

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    
    try {
      await updateProject(project.id, { status: newStatus as any });
      toast({
        title: "Status atualizado",
        description: `Status do projeto alterado para ${getStatusLabel(newStatus)}`
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Não foi possível atualizar o status do projeto.",
        variant: "destructive"
      });
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

              <div className="mt-3">
                <label className="text-xs text-medium-gray mb-1 block">Atualizar Status:</label>
                <Select 
                  value={project?.status} 
                  onValueChange={handleStatusChange}
                  disabled={project?.status === 'finalizado'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="finalizado">Concluído</SelectItem>
                  </SelectContent>
                </Select>
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
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime()) // Ordena por data
            .map(([date, dailyComments]) => (
              <div key={date} className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px bg-border flex-1"></div>
                  <span className="text-sm font-medium text-dark-gray px-3 py-1 bg-light-gray rounded-full">
                    {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                
                <div className="space-y-3">
                  {dailyComments
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Ordena comentários do dia por timestamp
                    .map((comment) => (
                      <Card key={comment.id} className="shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="bg-wine-red-light p-2 rounded-lg">
                              {comment.type === 'audio' ? (
                                <Mic className="h-4 w-4 text-wine-red" />
                              ) : (
                                <FileText className="h-4 w-4 text-wine-red" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-medium-gray">
                                  {new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {comment.user?.nome}
                                  </Badge>
                                  
                                  {/* Comment Options Menu */}
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
                                            <Trash2 className="mr-2 h-3 w-3" />
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
                                            {comment.texto || "Transcrição não disponível"}
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
        {/* Botão Anexar */}
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
          <Paperclip className="h-5 w-5 text-medium-gray" />
        </Button>
        
        {/* Campo de texto (Textarea) */}
        <Textarea
          placeholder={isRecording ? `Gravando... ${formatTime(recordingTime)}` : "Adicionar observação..."}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 resize-none min-h-[40px] max-h-32 text-base rounded-full py-2 px-4 shadow-inner"
          rows={1}
          disabled={isRecording} // Desabilita o textarea durante a gravação
        />
        
        {/* Botão Dinâmico: Enviar ou Microfone */}
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
          <Button
            size="icon"
            className={`h-10 w-10 rounded-full shrink-0 ${
              isRecording 
                ? "bg-destructive hover:bg-destructive/90 pulse-record" // Efeito de pulsação para gravação
                : "bg-wine-red hover:bg-wine-red-hover"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
            disabled={isAddingComment}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
};