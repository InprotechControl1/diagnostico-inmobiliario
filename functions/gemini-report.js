export async function onRequest(context) {
  // Solo aceptar POST
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { answers } = await context.request.json();

  // Construir el prompt para Gemini
  const prompt = `Eres un consultor inmobiliario experto en el mercado venezolano.
Con base en las siguientes respuestas de un agente o agencia, genera un informe personalizado.
Incluye diagnóstico, fortalezas, áreas de mejora y un plan de acción con herramientas concretas y pasos a seguir.
Usa un tono profesional pero cercano, y organiza el contenido con secciones claras (Resumen ejecutivo, Diagnóstico por áreas, Recomendaciones, Herramientas sugeridas).
  
Respuestas del usuario:
${JSON.stringify(answers, null, 2)}
`;

  const GEMINI_API_KEY = context.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  const reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el informe. Por favor, inténtalo de nuevo más tarde.';

  return new Response(JSON.stringify({ report: reportText }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
