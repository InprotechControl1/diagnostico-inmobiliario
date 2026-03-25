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

    // 1. Obtener el contenido de la URL con un User-Agent realista
    const htmlResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
      }
    });
    if (!htmlResponse.ok) {
      throw new Error(`Error al obtener la página: ${htmlResponse.status}`);
    }
    const html = await htmlResponse.text();
    console.log(`HTML obtenido (primeros 500 chars): ${html.slice(0, 500)}`);

    // 2. Llamar a Gemini para extraer datos
    const GEMINI_API_KEY = env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('API Key de Gemini no configurada');
    }

    const prompt = `
Eres un asistente experto en extraer información de propiedades inmobiliarias a partir del HTML de una página web.
A continuación se proporciona el código HTML de una página que contiene una propiedad en venta o alquiler.
Extrae los siguientes campos y devuélvelos ÚNICAMENTE en formato JSON válido sin texto adicional.

- titulo: título o nombre de la propiedad (si no aparece, usa el título de la página)
- precio: precio en texto (incluye moneda si aparece)
- ubicacion: ubicación (ciudad, zona, estado)
- descripcion: descripción corta (máximo 200 caracteres)
- imagenes: array de URLs de imágenes (extrae las primeras 3 que parezcan fotografías de la propiedad)

Si algún campo no se encuentra, devuelve null.

HTML:
${html.slice(0, 35000)}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
        })
      }
    );

    const geminiData = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error('Gemini error response:', geminiData);
      throw new Error(`Gemini API error: ${geminiData.error?.message || 'unknown'}`);
    }

    let extractedText = geminiData.candidates[0].content.parts[0].text;
    console.log('Gemini raw response:', extractedText);

    // Limpiar marcadores de código
    extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted = JSON.parse(extractedText);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
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
