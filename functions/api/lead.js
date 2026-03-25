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

    // 1. Guardar en Cloudflare D1
    const { DB } = env;
    const createdAt = Date.now();
    await DB.prepare(
      `INSERT INTO leads (name, email, phone, diagnostic, created_at) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(name, email, phone, JSON.stringify(diagnostic || {}), createdAt)
      .run();

    // 2. Enviar a Google Sheets (sin bloquear la respuesta final)
    const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz0GIr1_1xGeLsgRPfVBkcpAFpUu9C2c-FDWBTPs-96Q7dIg0wuZyG-gjpl3biOGxYf/exec';
    
    context.waitUntil(
      fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, diagnostic })
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(() => console.log('Lead enviado a Google Sheets correctamente'))
      .catch(err => console.error('Error al enviar a Google Sheets:', err))
    );

    // 3. Responder éxito al frontend
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
