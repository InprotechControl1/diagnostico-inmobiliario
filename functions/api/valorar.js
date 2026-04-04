export async function onRequest() {
  return new Response(JSON.stringify({ test: "ok", valor_estimado: 100000 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
