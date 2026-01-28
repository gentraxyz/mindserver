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

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer')) {
      return new Response(JSON.stringify({
        error: 'Missing Authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userKey = authHeader.replace(/^Bearer\s+/i, '');
    if (!userKey) {
      return new Response(JSON.stringify({
        error: 'Invalid API Key'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const keyData = await getProviderKey(userKey, env);

    if (!keyData) {
      return new Response(JSON.stringify({
        error: 'Invalid API Key'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { provider: keyProvider, provider_key: validApiKey } = keyData;

    // A key is universal if its provider is 'all' OR it's a managed 'internal' key.
    const isUniversalKey = keyProvider === 'all' || validApiKey === 'internal';

    if (!isUniversalKey && provider !== keyProvider) {
      return new Response(JSON.stringify({
        error: `Provider mismatch. You are trying to use ${provider} but your key is for ${keyProvider}`
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let apiKey = validApiKey;

    // Managed Access Logic:
    // If provider_key is 'internal', we use the Worker's environment variables.
    if (apiKey === 'internal') {
      if (provider === 'openrouter') {
        apiKey = env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured in worker');
      } else if (provider === 'cerebras') {
        apiKey = env.CEREBRAS_API_KEY;
        if (!apiKey) throw new Error('CEREBRAS_API_KEY not configured in worker');
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
    } else if (provider === 'cerebras') {
      // Cerebras might need specific headers if any
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
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer')) {
    return new Response(JSON.stringify({
      error: 'Missing Authorization header'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userKey = authHeader.replace(/^Bearer\s+/i, '');
  if (!userKey) {
    return new Response(JSON.stringify({
      error: 'Invalid API Key'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const keyData = await getProviderKey(userKey, env);

  const isUniversalKey = keyData.provider === 'all' || keyData.provider_key === 'internal';
  if (!keyData || (!isUniversalKey && keyData.provider !== 'openrouter')) {
    // Embedding only supported on OpenRouter
    return new Response(JSON.stringify({
      error: 'Invalid API Key or provider does not support embeddings (requires OpenRouter)'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let apiKey = keyData.provider_key;
  if (apiKey === 'internal') {
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
    if (path === '/keys/register' && request.method === 'POST') {
      return handleRegisterKey(request, env);
    }

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

/**
 * Handle new key registration
 */
async function handleRegisterKey(request, env) {
  try {
    const body = await request.json();
    const provider = body.provider || 'all';
    const provider_key = 'internal'; // Always set to internal for managed access

    if (!['openrouter', 'cerebras', 'all'].includes(provider)) {
      return new Response(JSON.stringify({ error: 'Invalid provider. Must be openrouter, cerebras or all' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a new unique key for the user
    // Simple UUID-like generation for now
    const newKey = 'sk-' + crypto.randomUUID();

    const result = await env.DB.prepare(
      'INSERT INTO user_keys (id, provider, provider_key) VALUES (?, ?, ?)'
    )
      .bind(newKey, provider, provider_key)
      .run();

    if (!result.success) {
      throw new Error('Failed to insert into database');
    }

    return new Response(JSON.stringify({
      key: newKey,
      message: 'Access Key registered successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to register key',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getProviderKey(userKey, env) {
  if (!userKey || !userKey.startsWith('sk-')) {
    return null; // Invalid format
  }

  const result = await env.DB.prepare(
    'SELECT provider, provider_key FROM user_keys WHERE id = ?'
  )
    .bind(userKey)
    .first();

  return result; // Returns { provider, provider_key } or null
}
