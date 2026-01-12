/**
 * Worker Model Adapter
 * 
 * This model class sends LLM requests to the MindServer Cloudflare Worker
 * instead of directly calling various LLM APIs. The worker handles
 * routing requests to OpenRouter.
 */

import { strictFormat } from '../utils/text.js';
import settings from '../agent/settings.js';

export class WorkerModel {
    static prefix = 'worker';

    constructor(model_name, url) {
        this.model_name = model_name || 'openai/gpt-4o-mini';
        // Priority: constructor url > settings.worker_url > env var > localhost
        this.url = url || settings.worker_url || process.env.WORKER_URL || 'http://localhost:8787';
    }

    async sendRequest(turns, systemMessage, stop_seq = '*') {
        let messages = [{ role: 'system', content: systemMessage }, ...turns];
        messages = strictFormat(messages);

        const requestBody = {
            model: this.model_name,
            messages,
            stop: stop_seq
        };

        const maxRetries = 5;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            let res = null;
            try {
                console.log(`Awaiting worker API response... (attempt ${attempt}/${maxRetries})`);
                const response = await fetch(`${this.url}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error('Worker API error:', data);
                    lastError = 'API returned error status';
                    continue;
                }

                if (!data?.choices?.[0]) {
                    console.error('No completion or choices returned:', data);
                    lastError = 'No completion returned';
                    continue;
                }

                if (data.choices[0].finish_reason === 'length') {
                    throw new Error('Context length exceeded');
                }

                res = data.choices[0].message.content;

                // Check if response is empty or only whitespace
                if (!res || res.trim() === '') {
                    console.warn(`Received empty response on attempt ${attempt}, retrying...`);
                    lastError = 'Empty response received';
                    continue;
                }

                console.log('Received.');
                return res;
            } catch (err) {
                console.error(`Error while awaiting response (attempt ${attempt}):`, err);
                lastError = err.message;
                if (attempt < maxRetries) {
                    // Wait a bit before retrying (exponential backoff: 500ms, 1s, 2s, 4s, 8s)
                    const delay = 500 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`Failed after ${maxRetries} retry attempts. Last error: ${lastError}`);
        return 'My brain disconnected, try again.';
    }

    async sendVisionRequest(messages, systemMessage, imageBuffer) {
        const imageMessages = [...messages];
        imageMessages.push({
            role: "user",
            content: [
                { type: "text", text: systemMessage },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
                    }
                }
            ]
        });

        // For vision requests, the system message is included in the user message above
        // so we pass an empty system message to avoid duplication
        const requestBody = {
            model: this.model_name,
            messages: strictFormat(imageMessages),
        };

        const maxRetries = 5;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            let res = null;
            try {
                console.log(`Awaiting worker vision API response... (attempt ${attempt}/${maxRetries})`);
                const response = await fetch(`${this.url}/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json();

                if (!response.ok) {
                    console.error('Worker API error:', data);
                    lastError = 'API returned error status';
                    continue;
                }

                if (!data?.choices?.[0]) {
                    console.error('No completion or choices returned:', data);
                    lastError = 'No completion returned';
                    continue;
                }

                res = data.choices[0].message.content;

                // Check if response is empty or only whitespace
                if (!res || res.trim() === '') {
                    console.warn(`Received empty vision response on attempt ${attempt}, retrying...`);
                    lastError = 'Empty response received';
                    continue;
                }

                console.log('Received.');
                return res;
            } catch (err) {
                console.error(`Error while awaiting vision response (attempt ${attempt}):`, err);
                lastError = err.message;
                if (attempt < maxRetries) {
                    // Wait a bit before retrying (exponential backoff: 500ms, 1s, 2s, 4s, 8s)
                    const delay = 500 * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`Failed after ${maxRetries} retry attempts. Last error: ${lastError}`);
        return 'My brain disconnected, try again.';
    }

    async embed(text) {
        try {
            const response = await fetch(`${this.url}/v1/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'openai/text-embedding-3-small',
                    input: text,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Worker embedding error:', data);
                throw new Error('Embedding request failed');
            }

            return data.data[0].embedding;
        } catch (err) {
            console.error('Embedding error:', err);
            throw new Error('Embeddings failed via worker.');
        }
    }
}
