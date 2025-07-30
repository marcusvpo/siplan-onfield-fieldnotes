import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Settings, 
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import { Project } from "@/hooks/use-projects";
import { ProjectFormDialog } from "./project-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onEdit: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ProjectDetailsDialog = ({ 
  open, 
  onOpenChange, 
  project, 
  onEdit, 
  onDelete 
}: ProjectDetailsDialogProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!project) return null;

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

  const handleEdit = async (data: any) => {
    await onEdit({ id: project.id, ...data });
    setEditDialogOpen(false);
  };

  const handleDelete = async () => {
    await onDelete(project.id);
    setDeleteDialogOpen(false);
    onOpenChange(false);
  };

  const isOverdue = () => {
    const today = new Date();
    const scheduledDate = new Date(project.data_agendada);
    return project.status !== 'finalizado' && scheduledDate < today;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl">Detalhes do Projeto</DialogTitle>
                <DialogDescription>
                  Visualize e gerencie todas as informações do projeto
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status e Chamado */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{project.chamado}</h3>
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(project.status)}
                {isOverdue() && (
                  <Badge variant="destructive">Atrasado</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Informações do Cartório */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Informações do Cartório
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm">{project.nome_cartorio}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p className="text-sm">{project.estado}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email de Contato</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{project.email_contato}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Técnicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Informações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sistema</label>
                  <p className="text-sm">{project.sistema}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data Agendada</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {new Date(project.data_agendada).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {project.user && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Implantador Responsável</label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {project.user.nome} ({project.user.username})
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
            {project.observacao_admin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações do Administrador</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{project.observacao_admin}</p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{new Date(project.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última atualização:</span>
                  <span>{new Date(project.updated_at).toLocaleString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <ProjectFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEdit}
        project={project}
        title="Editar Projeto"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{project.chamado}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};