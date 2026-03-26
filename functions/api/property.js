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

    // Guardar en D1
    const { DB } = env;
    const fecha = Date.now();

    await DB.prepare(
      `INSERT INTO properties (url, titulo, precio, ubicacion, descripcion, imagenes, agente_email, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(url, titulo || '', precio || '', ubicacion || '', descripcion || '', JSON.stringify(imagenes || []), agente_email, fecha)
      .run();

    // --- Enviar correo con Resend (en segundo plano) ---
    const RESEND_API_KEY = env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      context.waitUntil(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'InproShield <onboarding@resend.dev>', // Cambia por tu dominio verificado si lo tienes
            to: [agente_email],
            subject: '✅ Propiedad capturada con éxito',
            html: `
              <h1>Propiedad guardada en InproShield</h1>
              <p><strong>URL:</strong> <a href="${url}">${url}</a></p>
              <p><strong>Título:</strong> ${titulo || 'No especificado'}</p>
              <p><strong>Precio:</strong> ${precio || 'No especificado'}</p>
              <p><strong>Ubicación:</strong> ${ubicacion || 'No especificada'}</p>
              <p><strong>Descripción:</strong> ${descripcion || 'No especificada'}</p>
              <p><strong>Imágenes:</strong> ${imagenes ? imagenes.join(', ') : 'No disponibles'}</p>
              <hr>
              <p>Puedes gestionar tus propiedades desde tu panel de InproShield (próximamente).</p>
            `
          })
        }).then(res => {
          if (!res.ok) return res.text().then(text => { throw new Error(text) });
          console.log('Correo enviado a', agente_email);
        }).catch(err => {
          console.error('Error enviando correo:', err);
        })
      );
    } else {
      console.warn('RESEND_API_KEY no configurada, no se envió correo');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error guardando propiedad:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
