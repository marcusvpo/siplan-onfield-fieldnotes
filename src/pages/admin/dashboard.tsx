import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { useAtividadesRecentes } from "@/hooks/use-atividades-recentes";
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { ProjectDetailsDialog } from "@/components/admin/project-details-dialog";
import { ProjectFiltersSheet, ProjectFilters } from "@/components/admin/project-filters";
import { StatusBadge } from "@/components/ui/status-badge";
import { KanbanBoard } from "@/components/admin/kanban-board";
import { isProjectLate } from "@/utils/status-colors";
import { 
  Users, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye
} from "lucide-react";

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projects, stats, loading: projectsLoading, createProject, updateProject, deleteProject } = useProjects();
  const { getUserStats } = useUsers();
  const { atividades, loading: atividadesLoading } = useAtividadesRecentes();
  
  console.log("[ADMIN DASHBOARD] Usuário logado:", user);

  const handleLogout = async () => {
    console.log("[ADMIN DASHBOARD] Iniciando logout");
    const { error } = await signOut();
    if (error) {
      console.error("[ADMIN DASHBOARD] Erro no logout:", error);
      toast({
        title: "Erro no logout",
        description: error.message || "Erro inesperado",
        variant: "destructive"
      });
    } else {
      console.log("[ADMIN DASHBOARD] Logout realizado, redirecionando");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
      navigate("/");
    }
  };

  // Redirect if not admin
  if (user && user.tipo !== "admin") {
    console.log("[ADMIN DASHBOARD] Usuário não é admin, redirecionando");
    navigate("/mobile");
    return null;
  }

  const userStats = getUserStats();

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search filter
    const searchMatch = !searchTerm || 
      project.chamado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.nome_cartorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.user?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const statusMatch = !filters.status || project.status === filters.status;

    // Sistema filter
    const sistemaMatch = !filters.sistema || project.sistema === filters.sistema;

    // Estado filter
    const estadoMatch = !filters.estado || project.estado === filters.estado;

    // User filter
    const userMatch = !filters.usuario_id || project.usuario_id === filters.usuario_id;

    // Date filters
    const dataInicio = new Date(project.data_inicio_implantacao);
    const dataFim = new Date(project.data_fim_implantacao);
    const dataInicioMatch = !filters.data_inicio || dataInicio >= new Date(filters.data_inicio);
    const dataFimMatch = !filters.data_fim || dataFim <= new Date(filters.data_fim);

    // Overdue filter
    const now = new Date();
    const isOverdue = project.status !== 'finalizado' && dataFim < now;
    const atrasadosMatch = !filters.atrasados || isOverdue;

    return searchMatch && statusMatch && sistemaMatch && estadoMatch && 
           userMatch && dataInicioMatch && dataFimMatch && atrasadosMatch;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      "aguardando": { variant: "outline" as const, label: "Aguardando" },
      "em_andamento": { variant: "default" as const, label: "Em Andamento" },
      "finalizado": { variant: "secondary" as const, label: "Finalizado" },
      "cancelado": { variant: "destructive" as const, label: "Cancelado" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.aguardando;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleCreateProject = async (data: any) => {
    await createProject(data);
  };

  const handleUpdateProject = async (data: any) => {
    const { id, ...updates } = data;
    await updateProject(id, updates);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  const handleViewDetails = (project: any) => {
    setSelectedProject(project);
    setDetailsDialogOpen(true);
  };

  const isProjectOverdue = (project: any) => {
    const today = new Date();
    const endDate = new Date(project.data_fim_implantacao);
    return project.status !== 'finalizado' && endDate < today;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <FolderOpen className="h-4 w-4 text-wine-red" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">{stats.ativos}</div>
              <p className="text-xs text-medium-gray">Em andamento</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">{stats.concluidos}</div>
              <p className="text-xs text-medium-gray">Concluídos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">{stats.atrasados}</div>
              <p className="text-xs text-medium-gray">Precisam atenção</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Implantadores</CardTitle>
              <Users className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">{userStats.ativos}</div>
              <p className="text-xs text-medium-gray">Ativos no sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Últimas Atividades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Últimas Atividades
            </CardTitle>
            <CardDescription>
              Acompanhe as modificações recentes no sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {atividadesLoading ? (
              <div className="text-center py-4">Carregando atividades...</div>
            ) : atividades.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Nenhuma atividade recente</div>
            ) : (
              <div className="space-y-3">
                {atividades.map((atividade) => (
                  <div key={atividade.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {atividade.user?.nome || "Usuário"} {atividade.acao.toLowerCase()}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(atividade.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(atividade.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      {atividade.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {atividade.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kanban de Projetos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Visão Kanban dos Projetos
            </CardTitle>
            <CardDescription>
              Visualize os projetos organizados por status
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {projectsLoading ? (
              <div className="text-center py-8">Carregando projetos...</div>
            ) : (
              <KanbanBoard 
                projects={projects} 
                onViewProject={handleViewDetails} 
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ProjectFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateProject}
        title="Criar Novo Projeto"
      />

      <ProjectDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        project={selectedProject}
        onEdit={handleUpdateProject}
        onDelete={handleDeleteProject}
      />
    </AdminLayout>
  );
};