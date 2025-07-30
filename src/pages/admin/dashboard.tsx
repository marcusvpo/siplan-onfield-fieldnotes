import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Search,
  Filter
} from "lucide-react";

const mockProjects = [
  {
    id: 1,
    chamado: "CH-2025-001",
    cartorio: "1º Cartório de Notas - São Paulo",
    estado: "SP",
    sistema: "Orion PRO",
    implantador: "João Silva",
    dataAgendada: "2025-01-15",
    status: "Em Andamento",
    ultimaAtividade: "2 horas atrás"
  },
  {
    id: 2,
    chamado: "CH-2025-002", 
    cartorio: "Cartório de Registro Civil - Rio de Janeiro",
    estado: "RJ",
    sistema: "WebRI",
    implantador: "Maria Santos",
    dataAgendada: "2025-01-18",
    status: "Concluído",
    ultimaAtividade: "1 dia atrás"
  },
  {
    id: 3,
    chamado: "CH-2025-003",
    cartorio: "Cartório de Títulos - Brasília",
    estado: "DF",
    sistema: "Orion TN",
    implantador: "Pedro Costa",
    dataAgendada: "2025-01-20",
    status: "Atrasado",
    ultimaAtividade: "3 dias atrás"
  }
];

export const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  const getStatusBadge = (status: string) => {
    const variants = {
      "Em Andamento": "default",
      "Concluído": "secondary",
      "Atrasado": "destructive",
      "Agendado": "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <Header 
        userType="admin" 
        userName={user?.nome || "Administrador"}
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <FolderOpen className="h-4 w-4 text-wine-red" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">12</div>
              <p className="text-xs text-medium-gray">+2 esta semana</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">8</div>
              <p className="text-xs text-medium-gray">+3 esta semana</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">3</div>
              <p className="text-xs text-medium-gray">-1 desde ontem</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Implantadores</CardTitle>
              <Users className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-dark-gray">5</div>
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
                <Button variant="wine" className="gap-2">
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
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
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
                      <th className="text-left p-4 font-medium">Data Agendada</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Última Atividade</th>
                      <th className="text-left p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-mono text-sm">{project.chamado}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{project.cartorio}</div>
                            <div className="text-sm text-medium-gray">{project.estado}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{project.sistema}</Badge>
                        </td>
                        <td className="p-4">{project.implantador}</td>
                        <td className="p-4">{new Date(project.dataAgendada).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4">{getStatusBadge(project.status)}</td>
                        <td className="p-4 text-sm text-medium-gray">{project.ultimaAtividade}</td>
                        <td className="p-4">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};