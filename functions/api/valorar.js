export async function onRequestPost(context) {
  try {
    const inputData = await context.request.json();
    const response = await fetch('https://inproshield-api-proxy.rainiercasanova.workers.dev/api/valorar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });
    const data = await response.json();
    // Inyectamos el Anti-NaN Shield para que el frontend nunca reciba basura
    return new Response(JSON.stringify({
      integrity_score: data.integrity_score || 0,
      analysis: data.analysis || "Análisis técnico en proceso...",
      status: "Protección InproShield Activa"
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ integrity_score: 0, error: "Nodo en mantenimiento" }), { status: 200 });
  }
}
