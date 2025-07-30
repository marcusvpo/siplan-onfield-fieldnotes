import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { useProjectComments } from "@/hooks/use-project-comments";
import { useToast } from "@/hooks/use-toast";
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
  ArrowLeft
} from "lucide-react";

const mockTimeline = [
  {
    date: "2025-01-13",
    activities: [
      {
        id: 1,
        type: "audio",
        content: "Chegamos ao cartório às 9h, recepção muito atenciosa...",
        duration: "0:45",
        timestamp: "09:15"
      },
      {
        id: 2, 
        type: "text",
        content: "Reunião inicial realizada com sucesso. Definidos os requisitos técnicos.",
        timestamp: "14:30"
      }
    ]
  },
  {
    date: "2025-01-14",
    activities: [
      {
        id: 3,
        type: "audio", 
        content: "Iniciando configuração do servidor principal...",
        duration: "1:23",
        timestamp: "08:45"
      },
      {
        id: 4,
        type: "attachment",
        content: "Foto da configuração de rede",
        filename: "config_rede.jpg",
        timestamp: "10:20"
      }
    ]
  }
];


export const MobileProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading, updateProject } = useProjects();
  const { comments, loading: commentsLoading, addComment } = useProjectComments(id);
  const { toast } = useToast();
  
  const [isRecording, setIsRecording] = useState(false);
  const [newText, setNewText] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

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

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    // Timer simulation
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    setTimeout(() => {
      clearInterval(timer);
      setIsRecording(false);
      setRecordingTime(0);
    }, 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'attachment': return <ImageIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!project) return;
    
    setIsUpdatingStatus(true);
    try {
      await updateProject(project.id, { status: newStatus as any });
      toast({
        title: "Status atualizado",
        description: `Status do projeto alterado para ${getStatusLabel(newStatus)}`
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do projeto.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newText.trim() || !project) return;
    
    setIsAddingComment(true);
    const success = await addComment(newText.trim());
    
    if (success) {
      setNewText("");
    }
    
    setIsAddingComment(false);
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
    <div className="min-h-screen bg-background">
      <Header 
        userType="implantador" 
        userName={user?.nome || "Implantador"}
        onLogout={signOut}
      />
      
      <main className="pb-24">
        {/* Project Info - Fixed Header */}
        <div className="bg-white border-b border-border p-4 sticky top-16 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/mobile')}
                className="p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono text-medium-gray">{project.chamado}</span>
            </div>
            <Badge className={getStatusColor(project.status)}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
          <h1 className="text-lg font-bold text-dark-gray mb-1">
            {project.nome_cartorio}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-medium-gray">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(project.data_agendada).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{project.sistema}</span>
            </div>
          </div>
          
          {project.observacao_admin && (
            <div className="mt-3 p-2 bg-wine-red-light rounded-lg">
              <p className="text-xs text-wine-red font-medium">Observação do Admin:</p>
              <p className="text-sm text-dark-gray">{project.observacao_admin}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="mt-3">
            <label className="text-xs text-medium-gray mb-1 block">Atualizar Status:</label>
            <Select 
              value={project.status} 
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
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
        </div>

        {/* Comments/Timeline */}
        <div className="p-4 space-y-6">
          {comments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-dark-gray mb-4">Histórico de Atividades</h3>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-wine-red-light p-2 rounded-lg">
                          <FileText className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-medium-gray">
                              {new Date(comment.created_at).toLocaleString('pt-BR')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.user?.nome}
                            </Badge>
                          </div>
                          
                          <div className="bg-light-gray p-3 rounded-lg">
                            <p className="text-sm text-dark-gray">{comment.texto}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Mock Timeline for reference */}
          {mockTimeline.map((day, dayIndex) => (
            <div key={day.date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-border flex-1"></div>
                <span className="text-sm font-medium text-dark-gray px-3 py-1 bg-light-gray rounded-full">
                  {formatDate(day.date)}
                </span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="space-y-3">
                {day.activities.map((activity) => (
                  <Card key={activity.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-wine-red-light p-2 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-medium-gray">
                              {activity.timestamp}
                            </span>
                            {activity.duration && (
                              <Badge variant="outline" className="text-xs">
                                {activity.duration}
                              </Badge>
                            )}
                          </div>
                          
                          {activity.type === 'audio' && (
                            <div className="bg-wine-red-light p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Button size="sm" className="bg-wine-red hover:bg-wine-red-hover">
                                  <Play className="h-3 w-3" />
                                </Button>
                                <div className="flex-1 h-8 bg-wine-red/20 rounded relative">
                                  <div className="absolute inset-y-0 left-0 w-1/3 bg-wine-red rounded"></div>
                                </div>
                                <span className="text-xs text-wine-red">{activity.duration}</span>
                              </div>
                              <p className="text-sm text-dark-gray mt-2">{activity.content}</p>
                            </div>
                          )}
                          
                          {activity.type === 'text' && (
                            <div className="bg-light-gray p-3 rounded-lg">
                              <p className="text-sm text-dark-gray">{activity.content}</p>
                            </div>
                          )}
                          
                          {activity.type === 'attachment' && (
                            <div className="bg-light-gray p-3 rounded-lg">
                              <p className="text-sm text-dark-gray mb-1">{activity.content}</p>
                              <p className="text-xs text-medium-gray">{activity.filename}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 space-y-3">
        {/* Text Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Adicionar observação..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="resize-none"
            rows={1}
          />
          <Button 
            className="bg-wine-red hover:bg-wine-red-hover"
            disabled={!newText.trim() || isAddingComment}
            onClick={handleAddNote}
          >
            {isAddingComment ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Recording & Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Anexar
          </Button>
          
          <div className="flex-1 flex justify-center">
            <Button
              size="lg"
              className={`rounded-full w-16 h-16 ${
                isRecording 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-wine-red hover:bg-wine-red-hover"
              }`}
              onClick={startRecording}
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            className="bg-success text-white hover:bg-success/90 border-success"
            onClick={() => handleStatusChange('finalizado')}
            disabled={isUpdatingStatus || project.status === 'finalizado'}
          >
            {project.status === 'finalizado' ? 'Finalizado' : 'Finalizar'}
          </Button>
        </div>
        
        {isRecording && (
          <div className="text-center">
            <p className="text-sm text-wine-red font-medium">
              Gravando... {formatTime(recordingTime)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};