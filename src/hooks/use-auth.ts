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
    console.log('[AUTH] Inicializando hook de autenticação');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH] Evento de autenticação:', event, {
          sessionExists: !!session,
          userId: session?.user?.id
        });
        
        // Update session state
        setSession(session);
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('[AUTH] Usuário logado');
            if (session?.user) {
              // Use setTimeout to avoid calling Supabase in callback
              setTimeout(() => {
                loadUserData(session.user);
              }, 0);
            }
            break;
            
          case 'SIGNED_OUT':
            console.log('[AUTH] Usuário deslogado');
            setUser(null);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('[AUTH] Token renovado');
            if (session?.user) {
              setTimeout(() => {
                loadUserData(session.user);
              }, 0);
            }
            break;
            
          case 'INITIAL_SESSION':
            console.log('[AUTH] Sessão inicial detectada');
            if (session?.user) {
              setTimeout(() => {
                loadUserData(session.user);
              }, 0);
            } else {
              setLoading(false);
            }
            break;
            
          default:
            if (!session) {
              console.log('[AUTH] Sessão perdida, limpando estado');
              setUser(null);
            }
            setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH] Verificando sessão existente:', {
        sessionExists: !!session,
        userId: session?.user?.id
      });
      
      setSession(session);
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('[AUTH] Limpando subscription de autenticação');
      subscription.unsubscribe();
    };
  }, []); // Dependência vazia para evitar loops

  const loadUserData = async (authUser: any) => {
    try {
      console.log('[AUTH] Carregando dados do usuário:', authUser.id);
      
      // Try to get user data from our users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('[AUTH] Erro ao buscar usuário na tabela users:', error);
        // Se houve erro na consulta, use metadata como fallback
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username,
          tipo: authUser.user_metadata?.tipo || "implantador",
          nome: authUser.user_metadata?.nome || authUser.email
        };
        console.log('[AUTH] Usando dados do metadata como fallback:', fallbackUser);
        setUser(fallbackUser);
        setLoading(false);
        return;
      }

      if (userData) {
        // Use database data as source of truth
        const dbUser = {
          id: authUser.id,
          email: userData.email, // Use email from database for consistency
          username: userData.username,
          tipo: userData.tipo,
          nome: userData.nome
        };
        console.log('[AUTH] Usuário carregado do banco:', dbUser);
        setUser(dbUser);
      } else {
        // User not found in database, this shouldn't happen
        console.warn('[AUTH] Usuário não encontrado na tabela users, deslogando');
        toast({
          title: "Erro de Autenticação",
          description: "Usuário não encontrado no sistema. Faça login novamente.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        setUser(null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('[AUTH] Erro inesperado ao carregar dados do usuário:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Tentativa de login do admin:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('[AUTH] Erro no login do Auth (admin):', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Email ou senha inválidos.");
        }
        throw error;
      }

      console.log('[AUTH] Login no Auth realizado, verificando permissões de admin');

      // Verify if user is admin by checking our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tipo, ativo')
        .eq('auth_id', data.user?.id)
        .single();

      if (userError) {
        console.error('[AUTH] Erro ao verificar dados do admin:', userError);
        await supabase.auth.signOut();
        throw new Error("Erro ao verificar permissões de administrador.");
      }

      if (!userData || userData.tipo !== "admin" || !userData.ativo) {
        console.log('[AUTH] Usuário não é admin ou está inativo:', userData);
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Credenciais de administrador necessárias.");
      }

      console.log('[AUTH] Login de admin realizado com sucesso');
      return { data, error: null };
    } catch (error: any) {
      console.error('[AUTH] Erro no login do admin:', error.message);
      return { data: null, error };
    }
  };

  const signInUser = async (username: string, password: string) => {
    try {
      console.log('[AUTH] Tentativa de login do implantador:', username);
      
      // First, find user in our users table
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

      if (userError) {
        console.error('[AUTH] Erro ao buscar usuário:', userError);
        throw new Error("Usuário não encontrado ou inativo.");
      }

      if (!userData) {
        console.log('[AUTH] Usuário não encontrado:', username);
        throw new Error("Usuário não encontrado ou inativo.");
      }

      console.log('[AUTH] Usuário encontrado, tentando login no Auth:', userData.email);

      // Try to sign in with the email from our database
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      });

      if (error) {
        console.error('[AUTH] Erro no login do Auth:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Usuário ou senha inválidos.");
        }
        throw error;
      }

      // Verify user is not admin
      if (data.user?.user_metadata?.tipo === "admin") {
        console.log('[AUTH] Usuário é admin, redirecionando para acesso administrativo');
        await supabase.auth.signOut();
        throw new Error("Use o acesso administrativo para esta conta.");
      }

      console.log('[AUTH] Login do implantador realizado com sucesso');
      return { data, error: null };
    } catch (error: any) {
      console.error('[AUTH] Erro no login do implantador:', error.message);
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
