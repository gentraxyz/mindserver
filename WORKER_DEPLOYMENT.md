# Cloudflare Worker Deployment Guide

This guide explains how to deploy the updated MindServer Cloudflare Worker with support for both Cerebras and OpenRouter.

## Prerequisites

- A Cloudflare account
- `wrangler` CLI installed globally or locally
- Your OpenRouter and Cerebras API keys

## Quick Start

### 1. Navigate to the worker directory
```bash
cd worker
```

### 2. Install dependencies (if not already done)
```bash
npm install
```

### 3. Authenticate with Cloudflare
```bash
npx wrangler login
```
This will open a browser to authenticate your Cloudflare account.

### 4. Set your API keys as secrets

**For OpenRouter:**
```bash
npx wrangler secret put OPENROUTER_API_KEY
```
Paste your OpenRouter API key when prompted.

**For Cerebras:**
```bash
npx wrangler secret put CEREBRAS_API_KEY
```
Paste your Cerebras API key when prompted.

### 5. Deploy the worker
```bash
npm run deploy
```

### 6. Verify deployment
```bash
curl https://mindserver-worker.<your-subdomain>.workers.dev/health
```

You should see:
```json
{
  "status": "ok",
  "service": "mindserver-worker"
}
```

## Using the Worker

Once deployed, you can use the worker in two ways:

### Option A: Update MindServer settings
Edit your `settings.js` or configuration to use the worker URL for API calls:
```javascript
const WORKER_URL = 'https://mindserver-worker.<your-subdomain>.workers.dev';
```

### Option B: Use specific models
The worker automatically routes to the correct provider based on the model name:

**OpenRouter models** (any non-cerebras/* prefix):
```bash
curl -X POST https://mindserver-worker.<your-subdomain>.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Cerebras models** (use cerebras/* prefix):
```bash
curl -X POST https://mindserver-worker.<your-subdomain>.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "cerebras/llama-3.3-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Supported Features

- ✅ Chat completions via OpenRouter
- ✅ Chat completions via Cerebras
- ✅ Embeddings via OpenRouter (Cerebras doesn't support embeddings)
- ✅ Model-based routing (use `cerebras/*` for Cerebras)
- ✅ CORS support for browser requests
- ✅ Health check endpoint

## Troubleshooting

### "OPENROUTER_API_KEY not configured"
- Make sure you've set the secret: `npx wrangler secret put OPENROUTER_API_KEY`
- Verify the secret exists: `npx wrangler secret list`

### "CEREBRAS_API_KEY not configured"
- Make sure you've set the secret: `npx wrangler secret put CEREBRAS_API_KEY`
- Verify the secret exists: `npx wrangler secret list`

### 401 Unauthorized
- Check your API keys are correct and valid
- Ensure your keys haven't expired

### CORS errors
- The worker includes CORS headers for browser requests
- Make sure your origin is allowed (currently set to `*`)

## Development

To test locally before deploying:
```bash
npm run dev
```

This starts a local worker on `http://localhost:8787` for testing.

## Updating the Worker

To make changes:
1. Edit `src/index.js`
2. Test locally with `npm run dev`
3. Deploy with `npm run deploy`

## Security Notes

- API keys are stored as Cloudflare secrets (not in source code)
- Secrets are encrypted by Cloudflare
- Never commit API keys to git
- Keep your Cloudflare account secure
