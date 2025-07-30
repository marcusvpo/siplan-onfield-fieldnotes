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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify if user is admin
      if (data.user?.user_metadata?.tipo !== "admin") {
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
      // For now, we'll simulate user login by using email format
      // In production, this would query the users table by username
      const email = `${username}@user.siplan.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Verify if user is implantador
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