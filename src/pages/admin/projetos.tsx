import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectFormDialog } from "@/components/admin/project-form-dialog";
import { ProjectDetailsDialog } from "@/components/admin/project-details-dialog";
import { ProjectFiltersSheet } from "@/components/admin/project-filters";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { Search, Plus, Edit, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FilterState {
  status?: string;
  sistema?: string;
  estado?: string;
  usuario_id?: string;
  data_inicio?: string;
  data_fim?: string;
  atrasados?: boolean;
}

export default function AdminProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [viewingProject, setViewingProject] = useState<any>(null);

  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const { users } = useUsers();

  const implantadores = users.filter(user => user.tipo === 'implantador' && user.ativo);

  // Apply filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.nome_cartorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.chamado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.sistema.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesSistema = !filters.sistema || project.sistema.toLowerCase().includes(filters.sistema.toLowerCase());
    const matchesEstado = !filters.estado || project.estado === filters.estado;
    const matchesImplantador = !filters.usuario_id || project.usuario_id === filters.usuario_id;

    const matchesDateRange = (!filters.data_inicio || new Date(project.data_inicio_implantacao) >= new Date(filters.data_inicio)) &&
                            (!filters.data_fim || new Date(project.data_fim_implantacao) <= new Date(filters.data_fim));

    const isOverdue = filters.atrasados ? (
      project.status !== 'finalizado' && new Date(project.data_fim_implantacao) < new Date()
    ) : true;

    return matchesSearch && matchesStatus && matchesSistema && matchesEstado && matchesImplantador && matchesDateRange && isOverdue;
  });

  const handleCreateProject = async (projectData: any) => {
    try {
      await createProject(projectData);
      setIsCreateDialogOpen(false);
      toast.success("Projeto criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar projeto");
    }
  };

  const handleUpdateProject = async (projectData: any) => {
    try {
      await updateProject(editingProject.id, projectData);
      setEditingProject(null);
      toast.success("Projeto atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar projeto");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast.success("Projeto excluído com sucesso!");
    } catch (error) {
      toast.error("Erro ao excluir projeto");
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
            <p className="text-muted-foreground">
              Gerencie todos os projetos de implantação
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar projetos específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cartório, chamado ou sistema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <ProjectFiltersSheet
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Projetos</CardTitle>
            <CardDescription>
              {filteredProjects.length} projeto(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chamado</TableHead>
                    <TableHead>Cartório</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Implantador</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-4">
                        Nenhum projeto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.chamado}</TableCell>
                        <TableCell>{project.nome_cartorio}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.sistema}</Badge>
                        </TableCell>
                        <TableCell>{project.estado}</TableCell>
                        <TableCell>
                          <StatusBadge status={project.status} />
                        </TableCell>
                        <TableCell>{project.user?.nome || "Não atribuído"}</TableCell>
                        <TableCell>{new Date(project.data_inicio_implantacao).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(project.data_fim_implantacao).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingProject(project)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingProject(project)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o projeto "{project.nome_cartorio}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <ProjectFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
          title="Criar Novo Projeto"
        />

        {editingProject && (
          <ProjectFormDialog
            open={!!editingProject}
            onOpenChange={(open) => !open && setEditingProject(null)}
            onSubmit={handleUpdateProject}
            project={editingProject}
            title="Editar Projeto"
          />
        )}

        {viewingProject && (
          <ProjectDetailsDialog
            project={viewingProject}
            open={!!viewingProject}
            onOpenChange={(open) => !open && setViewingProject(null)}
            onEdit={handleUpdateProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </AdminLayout>
  );
}