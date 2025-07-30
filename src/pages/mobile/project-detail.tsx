import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Image as ImageIcon
} from "lucide-react";

const mockProject = {
  chamado: "CH-2025-001",
  cartorio: "1º Cartório de Notas - São Paulo",
  sistema: "Orion PRO", 
  dataAgendada: "2025-01-15",
  email: "contato@cartorio1sp.com.br",
  observacaoAdmin: "Cliente solicitou instalação prioritária do módulo de certidões"
};

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
  const [isRecording, setIsRecording] = useState(false);
  const [newText, setNewText] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

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

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userType="implantador" 
        userName="João Silva"
        onLogout={() => console.log("Logout")}
      />
      
      <main className="pb-24">
        {/* Project Info - Fixed Header */}
        <div className="bg-white border-b border-border p-4 sticky top-16 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-medium-gray">{mockProject.chamado}</span>
            <Badge className="bg-info text-white">Em Andamento</Badge>
          </div>
          <h1 className="text-lg font-bold text-dark-gray mb-1">
            {mockProject.cartorio}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-medium-gray">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(mockProject.dataAgendada).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{mockProject.sistema}</span>
            </div>
          </div>
          
          {mockProject.observacaoAdmin && (
            <div className="mt-3 p-2 bg-wine-red-light rounded-lg">
              <p className="text-xs text-wine-red font-medium">Observação do Admin:</p>
              <p className="text-sm text-dark-gray">{mockProject.observacaoAdmin}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="p-4 space-y-6">
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
            disabled={!newText.trim()}
          >
            <Send className="h-4 w-4" />
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
          >
            Finalizar
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