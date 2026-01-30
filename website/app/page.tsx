import { getSession } from '@/lib/session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">MindServer</span>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard" className="text-sm font-medium hover:text-emerald-400 transition-colors">
                Dashboard
              </Link>
            ) : (
              <a href="/api/auth/login" className="text-sm font-medium hover:text-emerald-400 transition-colors">
                Sign In
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            AI Agents for <br /> Minecraft
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create intelligent AI bots powered by LLMs that can explore, build, gather resources, and collaborate in your Minecraft worlds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Sign in with Google</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Agent Capabilities Section */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What Your AI Agents Can Do</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Powered by advanced LLMs like GPT-4, Claude, and Gemini, your agents think, plan, and act autonomously.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Explore & Gather</h3>
              <p className="text-gray-400 text-sm">Navigate the world, collect resources, and manage inventory intelligently.</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Build & Craft</h3>
              <p className="text-gray-400 text-sm">Construct structures, craft items, and execute complex building tasks.</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Chat & Respond</h3>
              <p className="text-gray-400 text-sm">Communicate naturally, follow commands, and respond to in-game events.</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2">Multi-Agent Collaboration</h3>
              <p className="text-gray-400 text-sm">Multiple agents working together to accomplish complex goals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose MindServer</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple LLM Support</h3>
              <p className="text-gray-400 leading-relaxed">
                Use OpenAI, Anthropic, Google, Mistral, and 15+ other AI providers. Switch models anytime with a simple config change.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Cloud-Powered Performance</h3>
              <p className="text-gray-400 leading-relaxed">
                Optional Cloudflare Worker deployment for globally distributed, low-latency LLM requests. No local API keys needed.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Customizable Agents</h3>
              <p className="text-gray-400 leading-relaxed">
                Define unique personalities, prompts, and behaviors. Create specialized bots for mining, farming, building, or combat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} MindServer. Built with Mineflayer & LLMs.</p>
      </footer>
    </main>
  );
}
