// functions/api/valorar.js - Puente InproShield 2026
export async function onRequestPost(context) {
  try {
    // 1. Recibimos los datos del formulario (ACM PRO, LinkShield, etc.)
    const inputData = await context.request.json();

    // 2. Conectamos con el Nodo de Bypass (Miami/Cloudflare)
    const response = await fetch('https://inproshield-api-proxy.rainiercasanova.workers.dev/api/valorar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(inputData)
    });

    const result = await response.json();

    // 3. Devolvemos el resultado (Garantiza score numérico gracias al Anti-NaN Shield)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Si el nodo falla, devolvemos un 0 seguro para no romper la interfaz
    return new Response(JSON.stringify({ 
      integrity_score: 0, 
      error: "Nodo de bypass no disponible en este momento" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
