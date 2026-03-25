import { load } from 'cheerio';

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'Falta URL' }), { status: 400 });
    }

    // Obtener el HTML
    const htmlResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!htmlResponse.ok) {
      throw new Error(`Error al obtener la página: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();

    // Extraer datos con cheerio
    const $ = load(html);
    let titulo = $('h1').first().text().trim() || $('title').text().trim();
    let precio = $('[itemprop="price"]').text().trim() || $('.price').first().text().trim() || $('.precio').first().text().trim();
    let ubicacion = $('[itemprop="address"]').text().trim() || $('.location').first().text().trim() || $('.ubicacion').first().text().trim();
    let descripcion = $('[itemprop="description"]').text().trim() || $('.description').first().text().trim();
    if (!descripcion) {
      descripcion = $('p').filter((i, el) => $(el).text().length > 100).first().text().trim();
    }

    // Extraer imágenes
    const imagenes = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
        imagenes.push(src);
      }
      if (imagenes.length >= 3) return false;
    });

    // Limpiar y estructurar
    const data = {
      titulo: titulo || null,
      precio: precio || null,
      ubicacion: ubicacion || null,
      descripcion: descripcion.substring(0, 200) || null,
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
