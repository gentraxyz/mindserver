import { getSession } from '@/lib/session';
import KeyManager from '@/components/KeyManager';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
    const session = await getSession();

    if (!session) {
        redirect('/');
    }

    const { user } = session;

    return (
        <main className="min-h-screen bg-black text-white p-6 md:p-12">
            <header className="max-w-6xl mx-auto flex items-center justify-between mb-16">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">MindServer</h1>
                </div>
                <div className="flex items-center gap-4">
                    {user.profile_image_url ? (
                        <img
                            src={user.profile_image_url}
                            alt={user.display_name || 'User'}
                            className="w-8 h-8 rounded-full border border-white/20"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full border border-white/20 bg-gray-800 flex items-center justify-center">
                            <span className="text-xs font-bold">{user.display_name?.[0] || 'U'}</span>
                        </div>
                    )}
                    <span className="text-sm text-gray-400 hidden sm:block">{user.display_name || user.username || 'User'}</span>
                    <a
                        href="/api/auth/logout"
                        className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors"
                    >
                        Sign Out
                    </a>
                </div>
            </header>

            <div className="max-w-6xl mx-auto">
                <div className="mb-12 text-center">
                    <h2 className="text-4xl font-bold mb-4">Welcome back, {(user.display_name || 'User').split(' ')[0]}</h2>
                    <p className="text-gray-400">Manage your access keys and monitor your usage.</p>
                </div>

                <KeyManager user={user} />
            </div>
        </main>
    );
}
