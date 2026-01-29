import KeyRegistration from "@/components/KeyRegistration";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="z-10 w-full max-w-4xl text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          MindServer
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Unlock the full potential of your AI agents. Generate a free access key to get started.
        </p>
      </div>

      <div className="z-10 w-full flex justify-center">
        <KeyRegistration />
      </div>

      <footer className="z-10 mt-16 text-gray-600 text-sm">
        <p>&copy; {new Date().getFullYear()} MindServer.</p>
      </footer>
    </main>
  );
}
