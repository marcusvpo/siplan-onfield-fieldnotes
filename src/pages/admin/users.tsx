import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from "lucide-react";

interface User {
  id: string;
  nome: string;
  email: string;
  username?: string;
  tipo: "admin" | "implantador";
  ativo: boolean;
  created_at: string;
}

export const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    username: "",
    password: ""
  });
  
  const { user: currentUser, signOut } = useAuth();
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      console.log("[USERS] Carregando usuários...");
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[USERS] Erro ao carregar usuários:", error);
        throw error;
      }

      console.log("[USERS] Usuários carregados:", data);
      setUsers(data || []);
    } catch (error: any) {
      console.error("[USERS] Erro:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[USERS] Criando usuário:", formData);
    
    try {
      // Validate required fields
      if (!formData.nome || !formData.email || !formData.username || !formData.password) {
        throw new Error("Todos os campos são obrigatórios");
      }

      // Create auth user via edge function
      const { data, error } = await supabase.functions.invoke('create-implantador', {
        body: formData
      });

      if (error) {
        throw new Error(data?.error || "Erro ao criar usuário");
      }

      toast({
        title: "Usuário criado",
        description: "Implantador criado com sucesso"
      });

      // Reset form and close dialog
      setFormData({ nome: "", email: "", username: "", password: "" });
      setDialogOpen(false);
      
      // Reload users list
      loadUsers();
      
    } catch (error: any) {
      console.error("[USERS] Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      console.log("[USERS] Alterando status do usuário:", { userId, currentStatus });
      
      const { error } = await supabase
        .from('users')
        .update({ ativo: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Status alterado",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      });

      loadUsers();
    } catch (error: any) {
      console.error("[USERS] Erro ao alterar status:", error);
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive"
      });
    }
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
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="wine" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Implantador
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Implantador</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do novo implantador. O username será usado para login.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome completo do implantador"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@empresa.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="usuario.login"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Senha inicial"
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="wine" className="flex-1">
                        Criar Usuário
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
    </div>
  );
};