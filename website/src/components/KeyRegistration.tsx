'use client';

import { useState } from 'react';

export default function KeyRegistration() {
    // ... (imports)
    const [provider] = useState('all');
    const [generatedKey, setGeneratedKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const WORKER_URL = 'https://mindserver-worker.webmaster-e1c.workers.dev';

    const handleRegister = async () => {
        setLoading(true);
        setError('');
        setGeneratedKey('');

        try {
            const res = await fetch(`${WORKER_URL}/keys/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider,
                    // No provider_key needed for managed access
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to register key');
            }

            setGeneratedKey(data.key);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-md bg-black border border-white/20 rounded-2xl p-8 animate-fade-in-up">

            <div className="space-y-4">
                <div className="text-center mb-4">
                    <p className="text-gray-400 text-sm">
                        Generate a secure access key to connect your MindServer agent.
                    </p>
                </div>

                <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </span>
                    ) : (
                        'Generate Access Key'
                    )}
                </button>

                {error && (
                    <div className="p-3 border border-white/50 rounded-lg text-white text-sm">
                        {error}
                    </div>
                )}

                {generatedKey && (
                    <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
                        <label className="block text-sm font-medium text-white mb-2">
                            Your MindServer Access Key
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                readOnly
                                value={generatedKey}
                                className="w-full bg-black border border-white/50 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-md transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? (
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Copy this key and paste it into basic settings in the MindServer Onboarding.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
