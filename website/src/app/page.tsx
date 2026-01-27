import KeyRegistration from "@/components/KeyRegistration";

export default function Home() {
    return (
        <main className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px] mix-blend-screen animate-float"></div>
            </div>

            <div className="z-10 w-full max-w-4xl text-center mb-10">
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4 animate-fade-in-down tracking-tight">
                    MindServer
                </h1>
                <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto animate-fade-in">
                    Unlock the full potential of your AI agents. Securely link your preferred provider to get started.
                </p>
            </div>

            <div className="z-10 w-full flex justify-center">
                <KeyRegistration />
            </div>

            <footer className="z-10 mt-16 text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} MindServer. Secure & Encrypted.</p>
            </footer>
        </main>
    );
}
