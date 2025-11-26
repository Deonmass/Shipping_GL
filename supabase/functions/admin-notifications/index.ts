import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json();
    const type = body.type as 'like' | 'post' | 'comment' | 'partner' | 'user';
    const title = (body.title as string) ?? '';
    const message = (body.message as string) ?? '';
    const data = body.data ?? null;

    if (!type || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing type, title or message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .neq('name', 'user');

    if (rolesError) {
      console.error('[admin-notifications] Error loading roles:', rolesError);
      throw rolesError;
    }

    const adminRoleIds = (roles ?? []).map((r: any) => r.id);

    if (adminRoleIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notificationsCreated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('user_id, role_id')
      .in('role_id', adminRoleIds);

    if (userRolesError) {
      console.error('[admin-notifications] Error loading user_roles:', userRolesError);
      throw userRolesError;
    }

    const adminUserIds = Array.from(
      new Set((userRoles ?? []).map((ur: any) => ur.user_id))
    );

    if (adminUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, notificationsCreated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const payload = adminUserIds.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      data,
    }));

    const { error: insertError } = await supabase
      .from('admin_notifications')
      .insert(payload);

    if (insertError) {
      console.error('[admin-notifications] Error inserting notifications:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated: payload.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[admin-notifications] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
