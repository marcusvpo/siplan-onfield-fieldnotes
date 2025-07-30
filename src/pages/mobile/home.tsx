import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Clock,
  ChevronRight
} from "lucide-react";

const mockUserProjects = [
  {
    id: 1,
    chamado: "CH-2025-001",
    cartorio: "1º Cartório de Notas",
    cidade: "São Paulo - SP",
    sistema: "Orion PRO",
    dataAgendada: "2025-01-15",
    status: "Em Andamento",
    hasNewActivity: false
  },
  {
    id: 2,
    chamado: "CH-2025-004",
    cartorio: "Cartório de Registro de Imóveis",
    cidade: "Santos - SP",
    sistema: "WebRI",
    dataAgendada: "2025-01-22",
    status: "Agendado",
    hasNewActivity: true
  }
];

export const MobileHome = () => {
  const getStatusColor = (status: string) => {
    const colors = {
      "Em Andamento": "bg-info text-white",
      "Agendado": "bg-warning text-white",
      "Concluído": "bg-success text-white"
    };
    return colors[status as keyof typeof colors] || "bg-medium-gray text-white";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userType="implantador" 
        userName="João Silva"
        onLogout={() => console.log("Logout")}
      />
      
      <main className="p-4 space-y-4">
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-dark-gray mb-2">
            Bem-vindo, João!
          </h1>
          <p className="text-medium-gray">
            Você tem <span className="font-semibold text-wine-red">2 projetos</span> atribuídos
          </p>
        </div>

        <div className="space-y-4">
          {mockUserProjects.map((project) => (
            <Card key={project.id} className="shadow-card hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-medium-gray">
                        {project.chamado}
                      </span>
                      {project.hasNewActivity && (
                        <div className="w-2 h-2 bg-wine-red rounded-full"></div>
                      )}
                    </div>
                    <h3 className="font-semibold text-dark-gray text-lg">
                      {project.cartorio}
                    </h3>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-medium-gray">
                    <MapPin className="h-4 w-4" />
                    <span>{project.cidade}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-medium-gray">
                    <Calendar className="h-4 w-4" />
                    <span>Agendado para {new Date(project.dataAgendada).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-wine-red" />
                    <span className="text-wine-red font-medium">{project.sistema}</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-wine-red hover:bg-wine-red-hover gap-2"
                  size="lg"
                >
                  Abrir Projeto
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockUserProjects.length === 0 && (
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