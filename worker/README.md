# MindServer Worker

A Cloudflare Worker that proxies LLM requests to OpenRouter or Cerebras, providing a simple API for the MindServer client.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your API keys as secrets:
   ```bash
   npx wrangler secret put OPENROUTER_API_KEY
   npx wrangler secret put CEREBRAS_API_KEY
   ```

3. Deploy to Cloudflare:
   ```bash
   npm run deploy
   ```

## Development

Run the worker locally:
```bash
npm run dev
```

## API Endpoints

### POST /v1/chat/completions

Send a chat completion request to either OpenRouter or Cerebras.

**Request Body:**
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "stop": "*",
  "max_tokens": 1000,
  "temperature": 1
}
```

**Model Selection:**
- Use `openai/*`, `anthropic/*`, or other OpenRouter model IDs for OpenRouter
- Use `cerebras/*` model IDs for Cerebras API

**Response:**
OpenAI-compatible chat completion response.

### POST /v1/embeddings

Generate embeddings for text (OpenRouter only).

**Request Body:**
```json
{
  "model": "openai/text-embedding-3-small",
  "input": "Text to embed"
}
```

### GET /health

Health check endpoint.

## Configuration

The worker requires the following secrets:
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `CEREBRAS_API_KEY`: Your Cerebras API key

Set secrets using:
```bash
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put CEREBRAS_API_KEY
```

## Deployment Steps

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Set up your secrets**:
   ```bash
   cd worker
   npx wrangler secret put OPENROUTER_API_KEY
   npx wrangler secret put CEREBRAS_API_KEY
   ```
   You'll be prompted to enter each API key.

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Verify deployment**:
   ```bash
   curl https://mindserver-worker.<your-subdomain>.workers.dev/health
   ```

## Using the Worker

Once deployed, update your MindServer client configuration to point to the worker URL:

```javascript
const workerUrl = 'https://mindserver-worker.<your-subdomain>.workers.dev';

// For OpenRouter models
await fetch(`${workerUrl}/v1/chat/completions`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [...]
  })
});

// For Cerebras models
await fetch(`${workerUrl}/v1/chat/completions`, {
  method: 'POST',
  body: JSON.stringify({
    model: 'cerebras/llama-3.3-70b',
    messages: [...]
  })
});
```
