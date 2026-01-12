/**
 * Worker Model Adapter
 * 
 * This model class sends LLM requests to the Mindcraft Cloudflare Worker
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

        let res = null;
        try {
            console.log('Awaiting worker API response...');
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
                return 'My brain disconnected, try again.';
            }

            if (!data?.choices?.[0]) {
                console.error('No completion or choices returned:', data);
                return 'No response received.';
            }

            if (data.choices[0].finish_reason === 'length') {
                throw new Error('Context length exceeded');
            }

            console.log('Received.');
            res = data.choices[0].message.content;
        } catch (err) {
            console.error('Error while awaiting response:', err);
            res = 'My brain disconnected, try again.';
        }
        return res;
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

        return this.sendRequest(imageMessages, systemMessage);
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
