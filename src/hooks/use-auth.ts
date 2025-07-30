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
      (event, session) => {
        setSession(session);
        if (session?.user) {
          // Transform Supabase user to our AuthUser format
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username,
            tipo: session.user.user_metadata?.tipo || "implantador",
            nome: session.user.user_metadata?.nome
          };
          setUser(authUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username,
          tipo: session.user.user_metadata?.tipo || "implantador",
          nome: session.user.user_metadata?.nome
        };
        setUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

      // Verify if user is admin
      if (data.user?.user_metadata?.tipo !== "admin") {
        console.log("[AUTH] Usuário não é admin:", { tipo: data.user?.user_metadata?.tipo });
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