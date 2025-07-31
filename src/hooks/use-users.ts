import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  nome: string;
  email: string;
  username?: string;
  tipo: 'admin' | 'implantador';
  ativo: boolean;
  auth_id?: string;
  created_at: string;
  updated_at: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    nome: string;
    email: string;
    username: string;
    password: string;
  }) => {
    try {
      // Call the create-implantador edge function
      const { data, error } = await supabase.functions.invoke('create-implantador', {
        body: userData
      });

      if (error) throw error;

      await loadUsers(); // Reload users list
      
      toast({
        title: "Usuário criado com sucesso",
        description: `O implantador ${userData.nome} foi criado.`
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => u.id === id ? { ...u, ...updates } : u)
      );

      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso."
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    return updateUser(id, { ativo: !currentStatus });
  };

  const deleteUser = async (id: string) => {
    try {
      // Use edge function for atomic deletion from both users table and Auth
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: id }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro na exclusão do usuário');
      }

      setUsers(prev => prev.filter(u => u.id !== id));

      toast({
        title: "Usuário excluído",
        description: "O usuário foi removido com sucesso de ambos os sistemas."
      });

      return { error: null };
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const getActiveImplantadores = () => {
    return users.filter(u => u.tipo === 'implantador' && u.ativo);
  };

  const getUserStats = () => {
    const implantadores = users.filter(u => u.tipo === 'implantador');
    return {
      total: users.length,
      implantadores: implantadores.length,
      ativos: implantadores.filter(u => u.ativo).length,
      inativos: implantadores.filter(u => !u.ativo).length
    };
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    loading,
    loadUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    getActiveImplantadores,
    getUserStats
  };
};