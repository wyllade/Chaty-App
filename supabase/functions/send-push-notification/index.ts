import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  try {
    const { userId, title, body, data }: NotificationPayload = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: user } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (!user?.push_token) {
      return new Response(JSON.stringify({ error: 'No push token' }), { status: 200 });
    }

    const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });

    const result = await expoResponse.json();

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
