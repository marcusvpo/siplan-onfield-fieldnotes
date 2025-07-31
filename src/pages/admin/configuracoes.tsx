import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Edit, Trash2, Database, Users, Shield, Bell } from "lucide-react";

export default function AdminConfiguracoesPage() {
  const sistemas = [
    { id: 1, nome: "e-Cart", versao: "2.4.1", ativo: true },
    { id: 2, nome: "Sistema CNJ", versao: "1.8.0", ativo: true },
    { id: 3, nome: "CertDig", versao: "3.2.0", ativo: false },
  ];

  const statusConfigurations = [
    { id: 1, nome: "Aguardando", cor: "#64748b", ordem: 1 },
    { id: 2, nome: "Em Andamento", cor: "#3b82f6", ordem: 2 },
    { id: 3, nome: "Pausado", cor: "#f59e0b", ordem: 3 },
    { id: 4, nome: "Concluído", cor: "#10b981", ordem: 4 },
    { id: 5, nome: "Cancelado", cor: "#ef4444", ordem: 5 },
  ];

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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sistema
                </Button>
              </div>
              
              <div className="space-y-2">
                {sistemas.map((sistema) => (
                  <div key={sistema.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{sistema.nome}</p>
                        <p className="text-sm text-muted-foreground">v{sistema.versao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={sistema.ativo ? "default" : "secondary"}>
                        {sistema.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Status
                </Button>
              </div>
              
              <div className="space-y-2">
                {statusConfigurations.map((status) => (
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
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Permissões
              </CardTitle>
              <CardDescription>
                Configure as permissões e níveis de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Administradores</p>
                    <p className="text-sm text-muted-foreground">Acesso total ao sistema</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Implantadores</p>
                    <p className="text-sm text-muted-foreground">Acesso aos próprios projetos</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Email de Novos Projetos</p>
                    <p className="text-sm text-muted-foreground">Notificar implantadores sobre novos projetos</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ativar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Relatórios Automáticos</p>
                    <p className="text-sm text-muted-foreground">Envio automático de relatórios semanais</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Alertas de Prazo</p>
                    <p className="text-sm text-muted-foreground">Avisos sobre projetos próximos do prazo</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ativar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações Avançadas
            </CardTitle>
            <CardDescription>
              Configurações técnicas e de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Backup e Segurança</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Configurar Backup Automático
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Políticas de Senha
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Log de Auditoria
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Integração</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    API Keys
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Webhooks
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Conectores Externos
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}