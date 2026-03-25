export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const data = await request.json();
    const { url, titulo, precio, ubicacion, descripcion, imagenes, agente_email } = data;

    if (!url || !agente_email) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400 });
    }

    const { DB } = env;
    const fecha = Date.now();

    await DB.prepare(
      `INSERT INTO properties (url, titulo, precio, ubicacion, descripcion, imagenes, agente_email, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(url, titulo || '', precio || '', ubicacion || '', descripcion || '', JSON.stringify(imagenes || []), agente_email, fecha)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error guardando propiedad:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
