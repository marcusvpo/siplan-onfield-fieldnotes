import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from '@/integrations/supabase/types'; // Importar Database type

// Definir o tipo de usuário do banco de dados para evitar conflitos de tipagem
type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface User {
  id: string;
  nome: string;
  email: string;
  username?: string;
  tipo: UserRow['tipo']; // Usa o tipo corrigido diretamente do Database
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

      // O map é necessário para garantir que o tipo 'tipo' esteja correto
      const fetchedUsers: User[] = data.map(u => ({
        ...u,
        tipo: u.tipo as UserRow['tipo'], // Cast do tipo de enum
      })) as User[];

      setUsers(fetchedUsers || []);
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

      // O retorno do invoke pode não ser tipado automaticamente como User,
      // então retornamos um tipo genérico ou null
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
      // Cria um objeto com apenas as propriedades do tipo UserUpdate
      const updatePayload: UserUpdate = {
        ativo: updates.ativo,
        nome: updates.nome,
        email: updates.email,
        username: updates.username,
        tipo: updates.tipo, // 'tipo' é corretamente inferido agora
        auth_id: updates.auth_id,
        created_at: updates.created_at,
        updated_at: updates.updated_at,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updatePayload) // Usa o payload tipado
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