import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get request body
    const { nome, email, username, password } = await req.json()
    
    // Validate required fields
    if (!nome || !email || !username || !password) {
      throw new Error('Todos os campos são obrigatórios')
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[CREATE IMPLANTADOR] Creating user:', { nome, email, username })

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      throw new Error('Nome de usuário já existe')
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        tipo: 'implantador',
        nome,
        username
      }
    })

    if (authError) {
      console.error('[CREATE IMPLANTADOR] Error creating auth user:', authError)
      throw authError
    }

    const userId = authData?.user?.id
    console.log('[CREATE IMPLANTADOR] Auth user created with ID:', userId)

    // Create corresponding user in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: userId,
        nome,
        email,
        username,
        tipo: 'implantador',
        ativo: true
      })
      .select()
      .single()

    if (userError) {
      console.error('[CREATE IMPLANTADOR] Error creating public user:', userError)
      throw userError
    }

    console.log('[CREATE IMPLANTADOR] User created successfully:', userData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Implantador criado com sucesso',
        user: userData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[CREATE IMPLANTADOR] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})