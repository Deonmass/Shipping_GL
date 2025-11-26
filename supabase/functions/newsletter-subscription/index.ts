import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { email } = await req.json();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingSubscriber, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subscriber:', checkError);
      throw checkError;
    }

    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString()
          })
          .eq('email', email);

        if (updateError) {
          console.error('Error reactivating subscriber:', updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Newsletter subscription reactivated',
            email: email,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email already subscribed',
            email: email,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const { error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([{
        email: email,
        status: 'active',
        subscribed_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Error inserting subscriber:', insertError);
      throw insertError;
    }

    console.log('Newsletter subscription successful:', { email, timestamp: new Date().toISOString() });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Newsletter subscription successful',
        email: email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
