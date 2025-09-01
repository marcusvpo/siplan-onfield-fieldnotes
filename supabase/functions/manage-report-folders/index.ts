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
    const { action, user_id, project_id, old_user_id } = await req.json()
    
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[MANAGE FOLDERS] Action:', action, { user_id, project_id, old_user_id })

    switch (action) {
      case 'create_user_folder':
        await createUserFolder(supabase, user_id)
        break
      case 'create_project_folder':
        await createProjectFolder(supabase, user_id, project_id)
        break
      case 'cleanup_project':
        await cleanupProject(supabase, user_id, project_id)
        break
      case 'move_project':
        await moveProject(supabase, old_user_id, user_id, project_id)
        break
      case 'backfill':
        await backfillFolders(supabase)
        break
      default:
        throw new Error('Ação inválida')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Operação realizada com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[MANAGE FOLDERS] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function createUserFolder(supabase: any, userId: string) {
  console.log('[MANAGE FOLDERS] Criando pasta do usuário:', userId)
  
  // Cria um arquivo placeholder para garantir que a pasta existe
  const { error } = await supabase.storage
    .from('relatorios')
    .upload(`${userId}/.emptyFolderPlaceholder`, new Blob(['']))
  
  if (error && !error.message.includes('already exists')) {
    throw error
  }
  
  console.log('[MANAGE FOLDERS] Pasta do usuário criada:', userId)
}

async function createProjectFolder(supabase: any, userId: string, projectId: string) {
  console.log('[MANAGE FOLDERS] Criando pasta do projeto:', { userId, projectId })
  
  // Cria um arquivo placeholder para garantir que a pasta existe
  const { error } = await supabase.storage
    .from('relatorios')
    .upload(`${userId}/${projectId}/.emptyFolderPlaceholder`, new Blob(['']))
  
  if (error && !error.message.includes('already exists')) {
    throw error
  }
  
  console.log('[MANAGE FOLDERS] Pasta do projeto criada:', { userId, projectId })
}

async function cleanupProject(supabase: any, userId: string, projectId: string) {
  console.log('[MANAGE FOLDERS] Limpando projeto:', { userId, projectId })
  
  try {
    // Lista todos os arquivos do projeto
    const { data: files, error: listError } = await supabase.storage
      .from('relatorios')
      .list(`${userId}/${projectId}`)
    
    if (listError) {
      console.warn('[MANAGE FOLDERS] Erro ao listar arquivos:', listError)
      return
    }
    
    if (!files || files.length === 0) {
      console.log('[MANAGE FOLDERS] Nenhum arquivo encontrado para limpeza')
      return
    }
    
    // Remove todos os arquivos
    const filePaths = files.map(file => `${userId}/${projectId}/${file.name}`)
    const { error: removeError } = await supabase.storage
      .from('relatorios')
      .remove(filePaths)
    
    if (removeError) {
      console.warn('[MANAGE FOLDERS] Erro ao remover alguns arquivos:', removeError)
    } else {
      console.log('[MANAGE FOLDERS] Projeto limpo com sucesso:', { userId, projectId })
    }
    
  } catch (error) {
    console.warn('[MANAGE FOLDERS] Erro na limpeza do projeto:', error)
  }
}

async function moveProject(supabase: any, oldUserId: string, newUserId: string, projectId: string) {
  console.log('[MANAGE FOLDERS] Movendo projeto:', { oldUserId, newUserId, projectId })
  
  try {
    // Lista arquivos da pasta antiga
    const { data: files, error: listError } = await supabase.storage
      .from('relatorios')
      .list(`${oldUserId}/${projectId}`)
    
    if (listError || !files || files.length === 0) {
      console.log('[MANAGE FOLDERS] Nenhum arquivo para mover')
      return
    }
    
    // Cria pasta do novo usuário se não existir
    await createUserFolder(supabase, newUserId)
    await createProjectFolder(supabase, newUserId, projectId)
    
    // Move cada arquivo
    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder') continue
      
      const oldPath = `${oldUserId}/${projectId}/${file.name}`
      const newPath = `${newUserId}/${projectId}/${file.name}`
      
      // Copia arquivo para nova localização
      const { error: moveError } = await supabase.storage
        .from('relatorios')
        .move(oldPath, newPath)
      
      if (moveError) {
        console.warn('[MANAGE FOLDERS] Erro ao mover arquivo:', oldPath, moveError)
      }
    }
    
    // Remove pasta antiga
    await cleanupProject(supabase, oldUserId, projectId)
    
    console.log('[MANAGE FOLDERS] Projeto movido com sucesso')
    
  } catch (error) {
    console.warn('[MANAGE FOLDERS] Erro ao mover projeto:', error)
  }
}

async function backfillFolders(supabase: any) {
  console.log('[MANAGE FOLDERS] Iniciando backfill das pastas')
  
  try {
    // Busca todos os usuários ativos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('auth_id, tipo, ativo')
      .eq('ativo', true)
      .eq('tipo', 'implantador')
    
    if (usersError) throw usersError
    
    // Busca todos os projetos
    const { data: projects, error: projectsError } = await supabase
      .from('projetos')
      .select('id, usuario_id')
      .not('usuario_id', 'is', null)
    
    if (projectsError) throw projectsError
    
    console.log('[MANAGE FOLDERS] Encontrados:', users?.length, 'usuários e', projects?.length, 'projetos')
    
    // Cria pastas de usuários
    for (const user of users || []) {
      if (user.auth_id) {
        await createUserFolder(supabase, user.auth_id)
      }
    }
    
    // Cria pastas de projetos
    for (const project of projects || []) {
      if (project.usuario_id) {
        await createProjectFolder(supabase, project.usuario_id, project.id)
      }
    }
    
    console.log('[MANAGE FOLDERS] Backfill concluído')
    
  } catch (error) {
    console.error('[MANAGE FOLDERS] Erro no backfill:', error)
    throw error
  }
}