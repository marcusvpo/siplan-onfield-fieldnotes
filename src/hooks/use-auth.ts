import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  tipo: "admin" | "implantador";
  nome?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Estado de autenticação mudou:', event, session?.user?.id);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AUTH] Token atualizado automaticamente');
        } else if (event === 'SIGNED_OUT') {
          console.log('[AUTH] Usuário deslogado');
          setUser(null);
          setSession(null);
        } else if (event === 'SIGNED_IN') {
          console.log('[AUTH] Usuário logado');
          setSession(session);
          if (session?.user) {
            await loadUserData(session.user);
          }
        }
        
        // Handle session expiration
        if (!session && event !== 'SIGNED_OUT' && user) {
          console.log('[AUTH] Sessão expirada detectada');
          toast({
            title: "Sessão Expirada",
            description: "Sua sessão expirou. Por favor, faça login novamente.",
            variant: "destructive",
            duration: 5000
          });
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AUTH] Verificando sessão existente:', session?.user?.id);
      setSession(session);
      if (session?.user) {
        await loadUserData(session.user);
      }
      setLoading(false);
    });

    // Periodic session check
    const checkSession = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[AUTH] Erro ao verificar sessão:', error);
        if (user) {
          toast({
            title: "Erro de Autenticação",
            description: "Ocorreu um erro com sua sessão. Redirecionando para login.",
            variant: "destructive"
          });
          setUser(null);
          setSession(null);
        }
      }
    }, 30000); // Verifica a cada 30 segundos

    return () => {
      subscription.unsubscribe();
      clearInterval(checkSession);
    };
  }, [user, toast]);

  const loadUserData = async (authUser: any) => {
    try {
      // Try to get user data from our users table
      const { data: userData, error, status } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (userData) {
        // Use database data as source of truth
        setUser({
          id: authUser.id,
          email: authUser.email,
          username: userData.username,
          tipo: userData.tipo,
          nome: userData.nome
        });
        return;
      }
      // Se não encontrou no banco, use metadata
      if (!userData || error) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username,
          tipo: authUser.user_metadata?.tipo || "implantador",
          nome: authUser.user_metadata?.nome || authUser.email
        });
      }
    } catch (error) {
      setUser(null);
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      // Verify if user is admin by checking our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tipo, ativo')
        .eq('auth_id', data.user?.id)
        .single();

      if (userError || !userData || userData.tipo !== "admin" || !userData.ativo) {
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Credenciais de administrador necessárias.");
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signInUser = async (username: string, password: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          auth_id,
          email,
          nome,
          tipo,
          username,
          ativo
        `)
        .eq('username', username)
        .eq('tipo', 'implantador')
        .eq('ativo', true)
        .single();

      if (userError || !userData) {
        throw new Error("Usuário não encontrado ou inativo.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      });

      if (error) throw error;
      if (data.user?.user_metadata?.tipo === "admin") {
        await supabase.auth.signOut();
        throw new Error("Use o acesso administrativo para esta conta.");
      }
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    localStorage.clear();
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInAdmin,
    signInUser,
    signOut
  };
};
