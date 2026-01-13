/**
 * MindServer Cloudflare Worker
 * 
 * This worker acts as a proxy for LLM requests, routing them through OpenRouter or Cerebras.
 * The client sends chat completion requests to this worker, and the worker
 * forwards them to the appropriate provider's API using the stored API key.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Determine which provider to use based on model name
 */
function getProviderConfig(model) {
  if (!model) return { provider: 'openrouter', url: OPENROUTER_API_URL };
  if (model.startsWith('cerebras/')) return { provider: 'cerebras', url: CEREBRAS_API_URL };
  return { provider: 'openrouter', url: OPENROUTER_API_URL };
}

/**
 * Handle chat completion requests
 */
async function handleChatCompletion(request, env) {
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

    const model = body.model || 'openai/gpt-4o-mini';
    const { provider, url } = getProviderConfig(model);
    
    let apiKey;
    if (provider === 'cerebras') {
      apiKey = env.CEREBRAS_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          error: 'CEREBRAS_API_KEY not configured in worker' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      apiKey = env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ 
          error: 'OPENROUTER_API_KEY not configured in worker' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Prepare request payload
    const requestPayload = {
      ...(body.params || {}),
      model,
      messages: body.messages,
    };
    
    // Add optional parameters if provided
    if (body.stop !== undefined) requestPayload.stop = body.stop;
    if (body.max_tokens !== undefined) requestPayload.max_tokens = body.max_tokens;
    if (body.temperature !== undefined) requestPayload.temperature = body.temperature;

    // Build headers based on provider
    let headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://mindcraft.ai';
      headers['X-Title'] = 'Mindcraft';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ 
        error: responseData.error || `${provider} request failed`,
        details: responseData
      }), {
        status: response.status,
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
