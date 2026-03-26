export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'Falta URL' }), { status: 400 });
    }

    // Obtener HTML
    const htmlResponse = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!htmlResponse.ok) {
      throw new Error(`Error al obtener la página: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();

    // Detectar si la página es una pantalla de login o carga dinámica
    if (html.match(/iniciar sesión|acceder|login|sign in/i) && !html.match(/precio|ubicación|descripción/i)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este portal requiere autenticación o carga datos con JavaScript. Prueba con un enlace de un portal que muestre la información sin iniciar sesión (ej. BienesOnline, OLX).'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // --- Extracción con expresiones regulares ---
    let titulo = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] ||
                 html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    titulo = titulo.trim();

    let precio = html.match(/U\$D\s*([\d.,]+)/i)?.[0] ||
                 html.match(/Precio[:\s]*([^\n<]+)/i)?.[1] || '';
    precio = precio.trim();

    // Ubicación
    let ubicacion = html.match(/Ubicaci[óo]n<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i)?.[1] || '';
    if (!ubicacion) {
      const ubicMatch = html.match(/Ubicaci[óo]n[\s\S]*?<p[^>]*>([^<]+)</i);
      ubicacion = ubicMatch ? ubicMatch[1].trim() : '';
    }
    ubicacion = ubicacion.trim();

    // Descripción
    let descripcion = html.match(/Descripci[óo]n<\/[^>]+>\s*<[^>]+>\s*<p>([^<]+)/i)?.[1] || '';
    if (!descripcion) {
      const descMatch = html.match(/Descripci[óo]n[\s\S]*?<p[^>]*>([^<]+)</i);
      descripcion = descMatch ? descMatch[1].trim() : '';
    }
    descripcion = descripcion.replace(/<[^>]*>/g, '').trim().substring(0, 200);

    // Imágenes
    const imagenes = [];
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[1];
      if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        imagenes.push(src);
        if (imagenes.length >= 3) break;
      }
    }

    const data = {
      titulo: titulo || null,
      precio: precio || null,
      ubicacion: ubicacion || null,
      descripcion: descripcion || null,
      imagenes: imagenes.slice(0, 3)
    };

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error en /api/extract:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
