import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ChevronRight
} from "lucide-react";

export const MobileHome = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading } = useProjects();

  const userProjects = projects;

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

  const handleOpenProject = (projectId: string) => {
    navigate(`/mobile/project/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wine-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userType="implantador" 
        userName={user?.nome || "Implantador"}
        onLogout={signOut}
      />
      
      <main className="p-4 space-y-4">
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-dark-gray mb-2">
            Bem-vindo, {user?.nome?.split(' ')[0] || 'Implantador'}!
          </h1>
          <p className="text-medium-gray">
            Você tem <span className="font-semibold text-wine-red">{userProjects.length} projetos</span> atribuídos
          </p>
        </div>

        <div className="space-y-4">
          {userProjects.map((project) => (
            <Card key={project.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-medium-gray">
                        {project.chamado}
                      </span>
                    </div>
                    <h3 className="font-semibold text-dark-gray text-lg">
                      {project.nome_cartorio}
                    </h3>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-medium-gray">
                    <MapPin className="h-4 w-4" />
                    <span>{project.estado}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-medium-gray">
                    <Calendar className="h-4 w-4" />
                    <span>Período: {new Date(project.data_inicio_implantacao).toLocaleDateString('pt-BR')} até {new Date(project.data_fim_implantacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-wine-red" />
                    <span className="text-wine-red font-medium">{Array.isArray(project.sistema) ? project.sistema.join(', ') : project.sistema}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-wine-red hover:bg-wine-red-hover gap-2"
                  size="lg"
                  onClick={() => handleOpenProject(project.id)}
                >
                  Abrir Projeto
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {userProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-light-gray rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-medium-gray" />
            </div>
            <h3 className="text-lg font-semibold text-dark-gray mb-2">
              Nenhum projeto ativo
            </h3>
            <p className="text-medium-gray">
              Aguarde a atribuição de novos projetos
            </p>
          </div>
        )}
      </main>
    </div>
  );
};