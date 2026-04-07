// functions/api/valorar.js - Conector al Nodo de Bypass
export async function onRequestPost(context) {
  try {
    const inputData = await context.request.json();

    // Llamada al Worker Central (Bypass Geográfico + Anti-NaN)
    const response = await fetch('https://inproshield-api-proxy.rainiercasanova.workers.dev/api/valorar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputData)
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ integrity_score: 0, error: "Error de enlace" }), { status: 500 });
  }
}
