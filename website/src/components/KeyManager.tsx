'use client';

import { useState, useEffect } from 'react';
import { config } from '../config';

interface Key {
    id: string;
    created_at: string;
}

interface User {
    username: string;
    display_name: string;
    profile_image_url: string | null;
}

export default function KeyManager({ user }: { user: User }) {
    const [keys, setKeys] = useState<Key[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.worker.url}/keys/list?username=${user.username}`);
            const data = await res.json();
            if (res.ok) {
                setKeys(data.keys || []);
            } else {
                console.error('Failed to fetch keys:', data);
            }
        } catch (err) {
            console.error('Error fetching keys:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const res = await fetch(`${config.worker.url}/keys/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'all',
                    username: user.username,
                    display_name: user.display_name
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to generate key');
            } else {
                await fetchKeys();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate key');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (keyId: string) => {
        navigator.clipboard.writeText(keyId);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <div className="bg-black/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Your API Keys</h2>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || keys.length >= 3}
                        className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {generating ? 'Generating...' : 'Create New Key'}
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading keys...</div>
                ) : keys.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
                        No API keys generated yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {keys.map((key) => (
                            <div key={key.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:bg-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 font-mono text-sm text-gray-300">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                                        </svg>
                                        <span className="truncate max-w-[300px]">{key.id}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-600 hidden sm:block">
                                            {new Date(key.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(key.id)}
                                            className="text-gray-400 hover:text-white transition-colors p-2"
                                            title="Copy Key"
                                        >
                                            {copiedKey === key.id ? (
                                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-500">
                        You can create up to 3 API keys. Keep them secure - they provide access to your AI agent.
                    </p>
                </div>
            </div>
        </div>
    );
}
