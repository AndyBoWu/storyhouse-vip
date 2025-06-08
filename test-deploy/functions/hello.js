export async function onRequest() {
  return new Response('Hello from Cloudflare Functions!', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}