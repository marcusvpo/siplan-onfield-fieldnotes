import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, AlertTriangle } from "lucide-react";

interface Project {
  id: string;
  chamado: string;
  nome_cartorio: string;
  sistema: string[];
  estado: string;
  status: string;
  data_inicio_implantacao: string;
  data_fim_implantacao: string;
  user?: {
    nome: string;
  };
}

interface KanbanBoardProps {
  projects: Project[];
  onViewProject: (project: Project) => void;
}

const statusColumns = [
  { key: 'aguardando', title: 'Aguardando', color: 'admin-bg-secondary border border-admin-border' },
  { key: 'em_andamento', title: 'Em Andamento', color: 'admin-bg-secondary border border-admin-border' },
  { key: 'pausado', title: 'Pausado', color: 'admin-bg-secondary border border-admin-border' },
  { key: 'finalizado', title: 'Finalizado', color: 'admin-bg-secondary border border-admin-border' },
  { key: 'cancelado', title: 'Cancelado', color: 'admin-bg-secondary border border-admin-border' }
];

export const KanbanBoard = ({ projects, onViewProject }: KanbanBoardProps) => {
  const getProjectsByStatus = (status: string) => {
    return projects.filter(project => project.status === status);
  };

  const isProjectOverdue = (project: Project) => {
    const today = new Date();
    const endDate = new Date(project.data_fim_implantacao);
    return project.status !== 'finalizado' && endDate < today;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statusColumns.map((column, columnIndex) => {
        const projectsInColumn = getProjectsByStatus(column.key);
        
        return (
          <div key={column.key} className="space-y-3 animate-fade-in-up" style={{animationDelay: `${columnIndex * 0.1}s`}}>
            <div className={`p-3 rounded-lg shadow-admin-card ${column.color}`}>
              <h3 className="font-semibold text-sm admin-text">{column.title}</h3>
              <p className="text-xs admin-text-muted">
                {projectsInColumn.length} projeto(s)
              </p>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {projectsInColumn.map((project, projectIndex) => (
                <Card 
                  key={project.id} 
                  className="cursor-pointer hover-admin transition-all admin-gradient-card border-admin-border shadow-admin-card animate-scale-in"
                  style={{animationDelay: `${(columnIndex * 0.1) + (projectIndex * 0.05)}s`}}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium admin-text">
                          #{project.chamado}
                        </CardTitle>
                        <CardDescription className="text-xs admin-text-muted">
                          {project.nome_cartorio}
                        </CardDescription>
                      </div>
                      {isProjectOverdue(project) && (
                        <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-2">
                    <Badge variant="outline" className="text-xs border-admin-border admin-text-muted">
                      {Array.isArray(project.sistema) ? project.sistema.join(', ') : project.sistema}
                    </Badge>
                    
                    <div className="flex items-center text-xs admin-text-muted">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(project.data_fim_implantacao).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {project.user && (
                      <div className="text-xs admin-text-muted">
                        {project.user.nome}
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1 text-xs admin-text-muted hover:admin-text hover:bg-admin-bg-secondary transition-spring"
                      onClick={() => onViewProject(project)}
                    >
                      <Eye className="h-3 w-3" />
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {projectsInColumn.length === 0 && (
                <div className="text-center py-4 text-xs admin-text-muted">
                  Nenhum projeto
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};