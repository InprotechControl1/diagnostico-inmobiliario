import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
    }

    const { DB } = env;
    const properties = await DB.prepare(
      `SELECT * FROM properties WHERE user_id = ? ORDER BY fecha DESC`
    ).bind(user.id).all();

    return new Response(JSON.stringify({ success: true, data: properties.results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error en dashboard:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
