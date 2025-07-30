import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { 
  Users, 
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { user: currentUser, signOut } = useAuth();
  const { 
    users, 
    loading, 
    createUser, 
    toggleUserStatus, 
    deleteUser 
  } = useUsers();

  const handleCreateUser = async (userData: any) => {
    await createUser(userData);
    setDialogOpen(false);
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    await toggleUserStatus(userId, currentStatus);
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUser(userId);
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-wine-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-medium-gray">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Header 
        userType="admin" 
        userName={currentUser?.nome || "Administrador"}
        onLogout={signOut}
      />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-wine-red" />
                  Gerenciamento de Usuários
                </CardTitle>
                <CardDescription>
                  Gerencie implantadores e suas permissões de acesso
                </CardDescription>
              </div>
              
              <Button variant="wine" className="gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo Implantador
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-medium-gray" />
                <Input
                  placeholder="Buscar por nome, email ou username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="rounded-lg border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light-gray">
                    <tr>
                      <th className="text-left p-4 font-medium">Nome</th>
                      <th className="text-left p-4 font-medium">Email</th>
                      <th className="text-left p-4 font-medium">Username</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Criado em</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-light-gray/50 transition-colors">
                        <td className="p-4 font-medium">{user.nome}</td>
                        <td className="p-4 text-medium-gray">{user.email}</td>
                        <td className="p-4">
                          {user.username ? (
                            <Badge variant="outline">{user.username}</Badge>
                          ) : (
                            <span className="text-medium-gray text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={user.tipo === "admin" ? "destructive" : "default"}>
                            {user.tipo === "admin" ? "Administrador" : "Implantador"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.ativo ? "secondary" : "outline"}>
                            {user.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-medium-gray">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {user.tipo !== "admin" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleToggleUser(user.id, user.ativo)}
                                  className="gap-1"
                                >
                                  {user.ativo ? (
                                    <>
                                      <UserX className="h-3 w-3" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-3 w-3" />
                                      Ativar
                                    </>
                                  )}
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Excluir
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir o usuário "{user.nome}"? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-medium-gray mx-auto mb-2" />
                    <p className="text-medium-gray">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <UserFormDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateUser}
      />
    </div>
  );
};