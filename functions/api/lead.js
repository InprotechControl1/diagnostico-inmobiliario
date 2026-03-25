export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const data = await request.json();
    const { name, email, phone, diagnostic } = data;

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { DB } = env;
    const createdAt = Date.now();

    await DB.prepare(
      `INSERT INTO leads (name, email, phone, diagnostic, created_at) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(name, email, phone, JSON.stringify(diagnostic || {}), createdAt)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error guardando lead:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
