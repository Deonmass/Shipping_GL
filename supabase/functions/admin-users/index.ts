// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // ⚠️ Vérification du token utilisateur désactivée temporairement
    // On fait confiance au contexte d'appel (frontend) pour le moment.

    switch (req.method) {
      case 'GET': {
        try {
          console.log('[admin-users] Starting user fetch operation')
          console.log('[admin-users] SUPABASE_URL:', Deno.env.get('SUPABASE_URL'))
          console.log('[admin-users] Service Role Key configured:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

          let users = []
          let useFallback = false

          try {
            console.log('[admin-users] Attempting to fetch users from auth.admin.listUsers()...')
            const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

            if (usersError) {
              console.error('[admin-users] Auth admin listUsers error:', {
                message: usersError.message,
                status: usersError.status,
                name: usersError.name,
                code: usersError.code,
                stack: usersError.stack
              })
              console.log('[admin-users] Will attempt fallback method using SQL query')
              useFallback = true
            } else {
              users = data?.users || []
              console.log(`[admin-users] Successfully fetched ${users.length} users from auth.admin.listUsers()`)
            }
          } catch (authError) {
            console.error('[admin-users] Exception when calling auth.admin.listUsers():', authError)
            console.log('[admin-users] Will attempt fallback method using SQL query')
            useFallback = true
          }

          if (useFallback) {
            console.log('[admin-users] Using fallback: fetching users via direct SQL query')
            try {
              const { data: authUsers, error: sqlError } = await supabaseAdmin
                .from('auth.users')
                .select('*')

              if (sqlError) {
                console.error('[admin-users] SQL query to auth.users failed:', sqlError)

                console.log('[admin-users] Attempting alternative: fetch from public.users and join')
                const { data: publicUsers, error: publicError } = await supabaseAdmin
                  .from('users')
                  .select('*')

                if (publicError) {
                  throw new Error(`All methods failed. SQL error: ${sqlError.message}, Public error: ${publicError.message}`)
                }

                console.log(`[admin-users] Fallback successful: fetched ${publicUsers?.length || 0} users from public.users`)

                users = publicUsers.map(user => ({
                  id: user.id,
                  email: user.email,
                  created_at: user.created_at,
                  updated_at: user.updated_at,
                  last_sign_in_at: null,
                  email_confirmed_at: user.created_at,
                  user_metadata: { name: user.full_name },
                  aud: 'authenticated',
                  role: 'authenticated'
                }))
              } else {
                console.log(`[admin-users] SQL fallback successful: fetched ${authUsers?.length || 0} users`)
                users = authUsers || []
              }
            } catch (fallbackError) {
              console.error('[admin-users] Fallback methods failed:', fallbackError)
              throw new Error(`Failed to fetch users: ${fallbackError.message}`)
            }
          }

          if (users.length === 0) {
            console.log('[admin-users] No users found in database')
            return new Response(
              JSON.stringify({
                users: [],
                message: 'No users found in the database'
              }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
              }
            )
          }

          console.log(`[admin-users] Enriching ${users.length} users with profile data`)
          const enrichedUsers = await Promise.all(
            users.map(async (user) => {
              try {
                const { data: profile, error: profileError } = await supabaseAdmin
                  .from('users')
                  .select('*')
                  .eq('id', user.id)
                  .maybeSingle()

                if (profileError) {
                  console.warn(`[admin-users] Failed to fetch profile for user ${user.id}:`, profileError.message)
                }

                return {
                  ...user,
                  profile: profile || null
                }
              } catch (err) {
                console.error(`[admin-users] Exception fetching profile for user ${user.id}:`, err)
                return {
                  ...user,
                  profile: null
                }
              }
            })
          )

          console.log(`[admin-users] Successfully returning ${enrichedUsers.length} enriched users`)

          return new Response(
            JSON.stringify({ users: enrichedUsers }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        } catch (err) {
          console.error('[admin-users] GET users exception:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          })
          throw err
        }
      }

      case 'DELETE': {
        const url = new URL(req.url)
        const userId = url.searchParams.get('userId')
        if (!userId) {
          throw new Error('User ID is required')
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (deleteError) {
          throw new Error(`Failed to delete user: ${deleteError.message}`)
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'PATCH':
      case 'POST': {
        const { userId, email_confirmed_at, resetPassword, email, is_active, status, newPassword } = await req.json()
        if (!userId) {
          throw new Error('User ID is required')
        }

        // Si un statut explicite est fourni, on met à jour la colonne status de public.users
        if (typeof status === 'string') {
          const { error: updateStatusErr } = await supabaseAdmin
            .from('users')
            .update({ status })
            .eq('id', userId)
          if (updateStatusErr) {
            throw new Error(`Failed to update status: ${updateStatusErr.message}`)
          }
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Compat : ancien comportement avec is_active, si encore utilisé ailleurs
        if (typeof is_active === 'boolean') {
          const newStatus = is_active ? 'active' : 'inactive'
          const { error: updatePublicErr } = await supabaseAdmin
            .from('users')
            .update({ status: newStatus })
            .eq('id', userId)
          if (updatePublicErr) {
            throw new Error(`Failed to update is_active/status: ${updatePublicErr.message}`)
          }
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // Résolution directe de l'utilisateur Auth par email pour reset / email_confirmed
        let candidateEmail = (email ?? '').trim()

        if (!candidateEmail) {
          const { data: publicUser, error: publicErr } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', userId)
            .maybeSingle()

          if (publicErr) {
            throw new Error(`Failed to resolve user by id: ${publicErr.message}`)
          }

          candidateEmail = (publicUser?.email ?? '').trim()
          if (!candidateEmail) {
            throw new Error('Failed to resolve user email from public.users')
          }
        }

        const { data: authUser, error: authLookupErr } = await supabaseAdmin
          .from('auth.users')
          .select('id')
          .eq('email', candidateEmail)
          .maybeSingle()

        if (authLookupErr) {
          throw new Error(`Failed to lookup auth user by email: ${authLookupErr.message}`)
        }
        if (!authUser?.id) {
          throw new Error('Auth user not found for resolved email')
        }

        const authUserId = authUser.id

        if (resetPassword) {
          const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { password: newPassword || 'sgladmin' }
          )
          if (resetError) {
            throw new Error(`Failed to reset password: ${resetError.message}`)
          }
        }

        if (email_confirmed_at !== undefined) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { email_confirmed_at }
          )
          if (updateError) {
            throw new Error(`Failed to update email confirmation: ${updateError.message}`)
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 405,
          }
        )
    }
  } catch (error) {
    console.error('Edge function error:', error)
    
    const status = error.message.includes('Unauthorized') ? 403 : 500
    const errorMessage = error.message || 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.details || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }
    )
  }
})