import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state change:', { event, session: session?.user?.email });
        setSession(session);
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AUTH] Getting existing session:', { session: session?.user?.email });
      setSession(session);
      
      if (session?.user) {
        await loadUserData(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: any) => {
    try {
      console.log('[AUTH] Loading user data for:', authUser.email);
      console.log('[AUTH] User metadata from auth:', authUser.user_metadata);
      
      // Try to get user data from our users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (error) {
        console.error('[AUTH] Error fetching user data:', error);
        // Fallback to auth metadata if database query fails
        const user: AuthUser = {
          id: authUser.id,
          email: authUser.email,
          username: authUser.user_metadata?.username,
          tipo: authUser.user_metadata?.tipo || "implantador",
          nome: authUser.user_metadata?.nome || authUser.email
        };
        setUser(user);
        return;
      }

      console.log('[AUTH] User data from database:', userData);
      
      // Use database data as source of truth
      const user: AuthUser = {
        id: authUser.id,
        email: authUser.email,
        username: userData.username,
        tipo: userData.tipo,
        nome: userData.nome
      };
      
      console.log('[AUTH] Final user data:', user);
      setUser(user);
    } catch (error) {
      console.error('[AUTH] Error in loadUserData:', error);
      setUser(null);
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    console.log("[AUTH] Tentativa de login do admin:", { email });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log("[AUTH] Erro de autenticação do admin:", error);
        throw error;
      }

      console.log("[AUTH] Dados do usuário autenticado:", { 
        userId: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata 
      });

      // Verify if user is admin by checking our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tipo, ativo')
        .eq('auth_id', data.user?.id)
        .single();

      if (userError || !userData) {
        console.log("[AUTH] Usuário não encontrado na tabela users:", userError);
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Credenciais de administrador necessárias.");
      }

      if (userData.tipo !== "admin" || !userData.ativo) {
        console.log("[AUTH] Usuário não é admin ou está inativo:", { tipo: userData.tipo, ativo: userData.ativo });
        await supabase.auth.signOut();
        throw new Error("Acesso negado. Credenciais de administrador necessárias.");
      }

      console.log("[AUTH] Login de admin bem-sucedido");
      return { data, error: null };
    } catch (error: any) {
      console.error("[AUTH] Erro no login do admin:", error);
      return { data: null, error };
    }
  };

  const signInUser = async (username: string, password: string) => {
    console.log("[AUTH] Tentativa de login do usuário:", { username });
    
    try {
      // First find the user by username in our database
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
        console.log("[AUTH] Usuário não encontrado:", { username, error: userError });
        throw new Error("Usuário não encontrado ou inativo.");
      }

      console.log("[AUTH] Usuário encontrado:", { userData });

      // Now try to authenticate with the email from our database
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password
      });

      if (error) {
        console.log("[AUTH] Erro de autenticação:", error);
        throw error;
      }

      // Verify if user is implantador
      if (data.user?.user_metadata?.tipo === "admin") {
        console.log("[AUTH] Tentativa de admin via login de usuário");
        await supabase.auth.signOut();
        throw new Error("Use o acesso administrativo para esta conta.");
      }

      console.log("[AUTH] Login de usuário bem-sucedido:", { 
        userId: data.user?.id, 
        userType: data.user?.user_metadata?.tipo 
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("[AUTH] Erro no login do usuário:", error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log("[AUTH] Realizando logout");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AUTH] Erro no logout:", error);
      } else {
        console.log("[AUTH] Logout realizado com sucesso");
      }
      return { error };
    } catch (error: any) {
      console.error("[AUTH] Erro inesperado no logout:", error);
      return { error };
    }
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