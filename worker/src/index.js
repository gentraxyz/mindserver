/**
 * MindServer Cloudflare Worker
 * 
 * This worker acts as a proxy for LLM requests, routing them through OpenRouter.
 * The client sends chat completion requests to this worker, and the worker
 * forwards them to OpenRouter's API using the stored API key.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle chat completion requests
 */
async function handleChatCompletion(request, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'OPENROUTER_API_KEY not configured in worker' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ 
        error: 'messages array is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Forward request to OpenRouter
    // Spread params first so specific parameters take precedence
    const requestPayload = {
      ...(body.params || {}),
      model: body.model || 'openai/gpt-4o-mini',
      messages: body.messages,
    };
    
    // Add optional parameters if provided
    if (body.stop !== undefined) requestPayload.stop = body.stop;
    if (body.max_tokens !== undefined) requestPayload.max_tokens = body.max_tokens;
    if (body.temperature !== undefined) requestPayload.temperature = body.temperature;

    const openRouterResponse = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindcraft.ai',
        'X-Title': 'Mindcraft',
      },
      body: JSON.stringify(requestPayload),
    });

    const responseData = await openRouterResponse.json();

    if (!openRouterResponse.ok) {
      return new Response(JSON.stringify({ 
        error: responseData.error || 'OpenRouter request failed',
        details: responseData
      }), {
        status: openRouterResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle embedding requests
 */
async function handleEmbedding(request, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'OPENROUTER_API_KEY not configured in worker' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    
    if (!body.input) {
      return new Response(JSON.stringify({ 
        error: 'input is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // OpenRouter supports embeddings via OpenAI-compatible endpoint
    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mindcraft.ai',
        'X-Title': 'Mindcraft',
      },
      body: JSON.stringify({
        model: body.model || 'openai/text-embedding-3-small',
        input: body.input,
      }),
    });

    const responseData = await embeddingResponse.json();

    if (!embeddingResponse.ok) {
      return new Response(JSON.stringify({ 
        error: responseData.error || 'Embedding request failed',
        details: responseData
      }), {
        status: embeddingResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process embedding request',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Health check endpoint
 */
function handleHealth() {
  return new Response(JSON.stringify({ 
    status: 'ok',
    service: 'mindserver-worker'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route requests
    if (path === '/v1/chat/completions' && request.method === 'POST') {
      return handleChatCompletion(request, env);
    }

    if (path === '/v1/embeddings' && request.method === 'POST') {
      return handleEmbedding(request, env);
    }

    if (path === '/health' || path === '/') {
      return handleHealth();
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
