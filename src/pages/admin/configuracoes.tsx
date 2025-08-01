import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, Plus, Edit, Trash2, Database } from "lucide-react";
import { useSistemas } from "@/hooks/use-sistemas";
import { useStatusProjeto } from "@/hooks/use-status-projeto";
import { SistemaFormDialog } from "@/components/admin/sistema-form-dialog";
import { StatusFormDialog } from "@/components/admin/status-form-dialog";

export default function AdminConfiguracoesPage() {
  const [sistemaDialogOpen, setSistemaDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingSistema, setEditingSistema] = useState<any>(null);
  const [editingStatus, setEditingStatus] = useState<any>(null);

  const { sistemas, loading: sistemasLoading, createSistema, updateSistema, deleteSistema } = useSistemas();
  const { statusList, loading: statusLoading, createStatus, updateStatus, deleteStatus } = useStatusProjeto();

  const handleCreateSistema = async (data: any) => {
    return await createSistema(data);
  };

  const handleUpdateSistema = async (data: any) => {
    return await updateSistema(editingSistema.id, data);
  };

  const handleDeleteSistema = async (id: string) => {
    await deleteSistema(id);
  };

  const handleCreateStatus = async (data: any) => {
    return await createStatus(data);
  };

  const handleUpdateStatus = async (data: any) => {
    return await updateStatus(editingStatus.id, data);
  };

  const handleDeleteStatus = async (id: string) => {
    await deleteStatus(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações gerais da plataforma
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sistemas
              </CardTitle>
              <CardDescription>
                Configure os sistemas disponíveis para implantação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sistemas Cadastrados</span>
                <Button size="sm" onClick={() => setSistemaDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sistema
                </Button>
              </div>
              
              <div className="space-y-2">
                {sistemasLoading ? (
                  <div className="text-center py-4">Carregando sistemas...</div>
                ) : sistemas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Nenhum sistema cadastrado</div>
                ) : (
                  sistemas.map((sistema) => (
                    <div key={sistema.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{sistema.nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={sistema.ativo ? "default" : "secondary"}>
                          {sistema.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingSistema(sistema);
                            setSistemaDialogOpen(true);
                          }}
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
                                Tem certeza que deseja excluir o sistema "{sistema.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSistema(sistema.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Status de Projeto
              </CardTitle>
              <CardDescription>
                Configure os status disponíveis para os projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status Configurados</span>
                <Button size="sm" onClick={() => setStatusDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Status
                </Button>
              </div>
              
              <div className="space-y-2">
                {statusLoading ? (
                  <div className="text-center py-4">Carregando status...</div>
                ) : statusList.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Nenhum status cadastrado</div>
                ) : (
                  statusList.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: status.cor }}
                        />
                        <div>
                          <p className="font-medium">{status.nome}</p>
                          <p className="text-sm text-muted-foreground">Ordem: {status.ordem}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.ativo ? "default" : "secondary"}>
                          {status.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingStatus(status);
                            setStatusDialogOpen(true);
                          }}
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
                                Tem certeza que deseja excluir o status "{status.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStatus(status.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Dialogs */}
        <SistemaFormDialog
          open={sistemaDialogOpen}
          onOpenChange={(open) => {
            setSistemaDialogOpen(open);
            if (!open) setEditingSistema(null);
          }}
          onSubmit={editingSistema ? handleUpdateSistema : handleCreateSistema}
          sistema={editingSistema}
          title={editingSistema ? "Editar Sistema" : "Adicionar Sistema"}
        />

        <StatusFormDialog
          open={statusDialogOpen}
          onOpenChange={(open) => {
            setStatusDialogOpen(open);
            if (!open) setEditingStatus(null);
          }}
          onSubmit={editingStatus ? handleUpdateStatus : handleCreateStatus}
          status={editingStatus}
          title={editingStatus ? "Editar Status" : "Adicionar Status"}
        />
      </div>
    </AdminLayout>
  );
}