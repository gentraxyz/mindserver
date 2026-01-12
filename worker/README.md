# MindServer Worker

A Cloudflare Worker that proxies LLM requests to OpenRouter, providing a simple API for the MindServer client.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your OpenRouter API key as a secret:
   ```bash
   npx wrangler secret put OPENROUTER_API_KEY
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

Send a chat completion request.

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

**Response:**
OpenRouter-compatible chat completion response.

### POST /v1/embeddings

Generate embeddings for text.

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

Set secrets using:
```bash
npx wrangler secret put OPENROUTER_API_KEY
```
