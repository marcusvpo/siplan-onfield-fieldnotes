import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('ID do usuário é obrigatório');
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First, get user data to know the auth_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('auth_id, nome, email')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
    }

    if (!userData) {
      throw new Error('Usuário não encontrado');
    }

    // Delete from users table first
    const { error: dbDeleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbDeleteError) {
      throw new Error(`Erro ao excluir usuário da tabela: ${dbDeleteError.message}`);
    }

    // Then delete from Auth (if auth_id exists)
    if (userData.auth_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
        userData.auth_id
      );

      if (authDeleteError) {
        // Try to rollback the database deletion
        await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            auth_id: userData.auth_id,
            nome: userData.nome,
            email: userData.email,
            tipo: 'implantador',
            ativo: false
          });

        throw new Error(`Erro ao excluir usuário do Auth: ${authDeleteError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário excluído com sucesso de ambos os sistemas' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});