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
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[CREATE ADMIN] Starting admin user creation...')

    // Create admin user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@siplan.com.br',
      password: 'siplan123',
      email_confirm: true,
      user_metadata: {
        tipo: 'admin',
        nome: 'Administrador do Sistema'
      }
    })

    if (authError) {
      console.error('[CREATE ADMIN] Error creating auth user:', authError)
      
      // If user already exists, get existing user by email
      if (authError.message.includes('already')) {
        console.log('[CREATE ADMIN] User already exists, fetching existing user...')
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error('[CREATE ADMIN] Error listing users:', listError)
          throw listError
        }
        
        const existingUser = existingUsers.users.find(u => u.email === 'admin@siplan.com.br')
        if (existingUser) {
          console.log('[CREATE ADMIN] Found existing user, updating metadata...')
          
          // Update user metadata to ensure admin type
          const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                tipo: 'admin',
                nome: 'Administrador do Sistema'
              }
            }
          )
          
          if (updateError) {
            console.error('[CREATE ADMIN] Error updating user metadata:', updateError)
            throw updateError
          }
          
          console.log('[CREATE ADMIN] User metadata updated successfully')
          authData = { user: updatedUser.user }
        } else {
          throw new Error('Admin user not found')
        }
      } else {
        throw authError
      }
    }

    const userId = authData?.user?.id
    console.log('[CREATE ADMIN] Auth user created with ID:', userId)

    // Create corresponding user in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        auth_id: userId,
        nome: 'Administrador do Sistema',
        email: 'admin@siplan.com.br',
        tipo: 'admin',
        ativo: true
      })
      .select()
      .single()

    if (userError) {
      console.error('[CREATE ADMIN] Error creating public user:', userError)
      throw userError
    }

    console.log('[CREATE ADMIN] Public user created:', userData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        authUser: authData?.user,
        publicUser: userData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[CREATE ADMIN] Error:', error)
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