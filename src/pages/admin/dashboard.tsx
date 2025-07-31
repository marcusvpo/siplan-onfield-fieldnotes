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
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { ProjectDetailsDialog } from "@/components/admin/project-details-dialog";
import { ProjectFiltersSheet, ProjectFilters } from "@/components/admin/project-filters";
import { StatusBadge } from "@/components/ui/status-badge";
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

        {/* Controles */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Projetos de Implantação</CardTitle>
                <CardDescription>
                  Gerencie todos os projetos e acompanhe o progresso em tempo real
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/users")}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Gerenciar Usuários
                </Button>
                <Button 
                  variant="wine" 
                  className="gap-2"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Novo Projeto
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-medium-gray" />
                <Input
                  placeholder="Buscar por cartório, chamado ou implantador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ProjectFiltersSheet 
                filters={filters} 
                onFiltersChange={setFilters} 
              />
            </div>

            {/* Tabela de Projetos */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Chamado</th>
                      <th className="text-left p-4 font-medium">Cartório</th>
                      <th className="text-left p-4 font-medium">Sistema</th>
                      <th className="text-left p-4 font-medium">Implantador</th>
                      <th className="text-left p-4 font-medium">Período</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Última Atividade</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsLoading ? (
                      <tr><td colSpan={8} className="p-8 text-center">Carregando projetos...</td></tr>
                    ) : filteredProjects.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center">Nenhum projeto encontrado</td></tr>
                    ) : (
                      filteredProjects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-mono text-sm">{project.chamado}</td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{project.nome_cartorio}</div>
                              <div className="text-sm text-medium-gray">{project.estado}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{project.sistema}</Badge>
                          </td>
                          <td className="p-4">{project.user?.nome || "Não atribuído"}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <div className="text-sm">
                                <div>{new Date(project.data_inicio_implantacao).toLocaleDateString('pt-BR')}</div>
                                <div className="text-medium-gray">até {new Date(project.data_fim_implantacao).toLocaleDateString('pt-BR')}</div>
                              </div>
                              {isProjectOverdue(project) && (
                                <AlertTriangle className="h-3 w-3 text-warning" />
                              )}
                            </div>
                          </td>
                          <td className="p-4">{getStatusBadge(project.status)}</td>
                          <td className="p-4 text-sm text-medium-gray">
                            {new Date(project.updated_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(project)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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