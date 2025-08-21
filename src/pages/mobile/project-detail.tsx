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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ChevronUp,
  Loader2,
  Camera,
  X
} from "lucide-react";

interface ProjectComment {
  id: string;
  texto: string;
  audio_url?: string;
  image_url?: string;
  type: 'text' | 'audio' | 'image';
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
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (projects.length > 0) {
      setLoading(false);
    }
  }, [projects]);

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

  // Refresh transcription status every 5 seconds for pending ones
  useEffect(() => {
    const pendingTranscriptions = Object.entries(transcriptionStatuses)
      .filter(([_, status]) => status === 'pending')
      .map(([id]) => id);

    if (pendingTranscriptions.length === 0) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('comentarios_projeto')
        .select('id, texto')
        .in('id', pendingTranscriptions);

      if (data) {
        data.forEach(comment => {
          if (comment.texto !== 'Transcrição pendente...') {
            setTranscriptionStatuses(prev => ({
              ...prev,
              [comment.id]: 'completed'
            }));
          }
        });
      }
    }, 5000);

    return () => clearInterval(interval);
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

  const handleRecordStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartPosition({ x: clientX, y: clientY });
    setDragPosition({ x: clientX, y: clientY });
    startRecording();
  };

  const handleRecordMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isRecording || !dragStartPosition) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartPosition.x;
    setDragPosition({ x: clientX, y: clientY });
    
    // Se arrastou mais de 100px para a esquerda, cancela
    if (deltaX < -100) {
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
  };

  const handleRecordEnd = () => {
    if (!isRecording) return;

    if (isDragging) {
      // Cancela a gravação
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
      setIsRecording(false);
      toast({
        title: "Gravação cancelada",
        description: "A gravação foi cancelada."
      });
    } else {
      stopRecording();
    }

    setDragStartPosition(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
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
        if (!isDragging) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsAddingComment(true);
          await addAudioComment(audioBlob); // Chama a função do hook
          setIsAddingComment(false);
        }
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

  const handleFileUpload = async (file: File) => {
    if (!project) return;

    try {
      setIsAddingComment(true);
      
      // Upload da imagem
      const filePath = `projetos/${project.id}/anexos/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project_files')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Criar comentário de imagem
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from('comentarios_projeto')
        .insert([{
          projeto_id: project.id,
          usuario_id: authUser.id,
          type: 'image',
          image_url: filePath,
          texto: file.name
        }]);

      if (error) throw error;

      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso."
      });

      setAttachmentDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.setAttribute('accept', '*/*');
      fileInputRef.current.click();
    }
  };

  const getImageUrl = async (imagePath: string) => {
    const { data } = await supabase.storage
      .from('project_files')
      .createSignedUrl(imagePath, 60 * 60);
    return data?.signedUrl;
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
                                          {comment.texto || "Transcrição não disponível"}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : comment.type === 'image' ? (
                              <div className="bg-light-gray p-2 rounded-lg max-w-xs">
                                <img 
                                  src={comment.image_url} 
                                  alt={comment.texto}
                                  className="w-full h-auto rounded cursor-pointer"
                                  onClick={() => window.open(comment.image_url, '_blank')}
                                  onLoad={async (e) => {
                                    if (comment.image_url && !comment.image_url.startsWith('http')) {
                                      const signedUrl = await getImageUrl(comment.image_url);
                                      if (signedUrl) {
                                        (e.target as HTMLImageElement).src = signedUrl;
                                      }
                                    }
                                  }}
                                />
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
        {/* Botão Anexar */}
        <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
              <Paperclip className="h-5 w-5 text-medium-gray" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar anexo</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-20"
                onClick={handleCameraCapture}
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Câmera</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-20"
                onClick={handleGallerySelect}
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Galeria</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-20"
                onClick={handleFileSelect}
              >
                <FileText className="h-6 w-6" />
                <span className="text-xs">Arquivo</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
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
            ref={recordButtonRef}
            size="icon"
            className={`h-10 w-10 rounded-full shrink-0 transition-all duration-200 ${
              isRecording 
                ? isDragging 
                  ? "bg-destructive hover:bg-destructive/90 animate-pulse" 
                  : "bg-destructive hover:bg-destructive/90 animate-pulse"
                : "bg-wine-red hover:bg-wine-red-hover"
            }`}
            onMouseDown={handleRecordStart}
            onMouseMove={handleRecordMove}
            onMouseUp={handleRecordEnd}
            onMouseLeave={handleRecordEnd}
            onTouchStart={handleRecordStart}
            onTouchMove={handleRecordMove}
            onTouchEnd={handleRecordEnd}
            aria-label={isRecording ? "Parar gravação" : "Iniciar gravação"}
            disabled={isAddingComment}
          >
            {isRecording ? (
              isDragging ? <X className="h-5 w-5" /> : <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* Cancel drag indicator */}
        {isRecording && isDragging && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-destructive text-white px-3 py-1 rounded-full text-sm z-50">
            Solte para cancelar
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileUpload(file);
          }
        }}
      />
    </div>
  );
};

export default MobileProjectDetail;