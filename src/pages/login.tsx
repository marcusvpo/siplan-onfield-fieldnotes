import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, User, ArrowLeft, Shield } from "lucide-react";

type LoginMode = "user" | "admin";

export const Login = () => {
  const [mode, setMode] = useState<LoginMode>("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("admin@siplan.com.br");
  const [password, setPassword] = useState("siplan123");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signInAdmin, signInUser } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.tipo === "admin") {
        navigate("/admin");
      } else {
        navigate("/mobile");
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (mode === "admin") {
        result = await signInAdmin(email, password);
      } else {
        result = await signInUser(username, password);
      }

      if (result.error) {
        toast({
          title: "Erro no login",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: mode === "admin" ? "Acesso Administrativo" : "Bem-vindo ao Siplan On-Field",
          description: mode === "admin" ? "Bem-vindo ao painel administrativo!" : "Login realizado com sucesso!"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    if (mode === "admin") {
      setEmail("admin@siplan.com.br");
      setPassword("siplan123");
    } else {
      setEmail("");
      setPassword("");
    }
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    resetForm();
  };

  // Initialize admin on first load (development only)
  const handleInitAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-admin');
      if (error) throw error;
      
      toast({
        title: "Admin inicializado",
        description: "Usuário admin criado com sucesso"
      });
    } catch (error: any) {
      console.log("Admin já existe ou erro:", error);
    }
  };

  // Auto-initialize admin on component mount (dev only)
  useEffect(() => {
    handleInitAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 animate-fade-in-up">
      <Card className="w-full max-w-md shadow-soft hover-lift rounded-2xl border-0 bg-gradient-glass animate-scale-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold text-dark-gray">
              {mode === "admin" ? "Acesso Administrativo" : "Acesso ao Sistema"}
            </CardTitle>
            <CardDescription className="text-base text-medium-gray">
              {mode === "admin" 
                ? "Painel de controle e gerenciamento" 
                : "Entre com suas credenciais para acessar a plataforma"
              }
            </CardDescription>
          </div>

          {/* Mode Indicator */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary-light rounded-full">
            {mode === "admin" ? (
              <>
                <Crown className="h-4 w-4 text-wine-red" />
                <span className="text-sm font-medium text-dark-gray">Administrador</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4 text-wine-red" />
                <span className="text-sm font-medium text-dark-gray">Usuário</span>
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {mode === "admin" ? (
              <>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-dark-gray">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@siplan.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-0 bg-light-gray shadow-soft transition-smooth focus:shadow-floating focus:bg-white"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium text-dark-gray">
                    Nome de Usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Seu nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 rounded-xl border-0 bg-light-gray shadow-soft transition-smooth focus:shadow-floating focus:bg-white"
                    required
                  />
                </div>
              </>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-medium text-dark-gray">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-0 bg-light-gray shadow-soft transition-smooth focus:shadow-floating focus:bg-white"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              variant="wine"
              className="w-full h-12 rounded-xl font-semibold disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </div>
              ) : (
                <>
                  {mode === "admin" ? "Acessar Painel" : "Entrar"}
                </>
              )}
            </Button>
          </form>

          {/* Mode Switch */}
          <div className="pt-4 border-t border-border">
            {mode === "user" ? (
              <Button
                variant="ghost"
                onClick={() => switchMode("admin")}
                className="w-full h-10 rounded-xl text-medium-gray hover:text-dark-gray hover:bg-light-gray transition-smooth"
              >
                <Shield className="h-4 w-4 mr-2" />
                Acesso Administrativo
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => switchMode("user")}
                className="w-full h-10 rounded-xl text-medium-gray hover:text-dark-gray hover:bg-light-gray transition-smooth"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};