/**
 * Cloudflare Pages Function: API Proxy
 * 
 * Proxies all /api/* requests to the Vercel backend
 * This enables the hybrid architecture where:
 * - Static content is served by Cloudflare Pages
 * - API requests are forwarded to Vercel
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  
  // Debug logging
  console.log('API Proxy Debug:', {
    url: request.url,
    method: request.method,
    params: params,
    envVarSet: !!env.VERCEL_API_URL
  });
  
  // Default to current Vercel deployment
  const vercelApiUrl = env.VERCEL_API_URL || 'https://testnet.storyhouse.vip';
  
  // Construct the API path
  const apiPath = params.catchall?.join('/') || '';
  const targetUrl = `${vercelApiUrl}/api/${apiPath}`;
  
  // Get the request URL to preserve query parameters
  const url = new URL(request.url);
  const targetUrlWithQuery = `${targetUrl}${url.search}`;
  
  console.log('Proxying to:', targetUrlWithQuery);
  
  try {
    // Forward the request to Vercel
    const proxyRequest = new Request(targetUrlWithQuery, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Make the request to Vercel
    const response = await fetch(proxyRequest);
    
    // Create a new response with CORS headers
    const proxyResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
    return proxyResponse;
    
  } catch (error) {
    console.error('API proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'API proxy error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle preflight OPTIONS requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}