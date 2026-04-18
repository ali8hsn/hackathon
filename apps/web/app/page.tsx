import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full px-4 py-1 text-red-400 text-sm font-medium tracking-wide">
            LIVE SYSTEM
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-white">
            SIREN
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Situational Intelligence &amp; Response Enablement Network.
            AI-powered 911 intake, real-time routing, and scene guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard"
            className="group flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 text-2xl">
              📡
            </div>
            <div>
              <div className="font-semibold text-white">Dispatcher</div>
              <div className="text-zinc-500 text-sm">Command center</div>
            </div>
          </Link>

          <Link
            href="/call"
            className="group flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 text-2xl">
              📞
            </div>
            <div>
              <div className="font-semibold text-white">Call Simulator</div>
              <div className="text-zinc-500 text-sm">AI hold intake</div>
            </div>
          </Link>

          <Link
            href="/scan"
            className="group flex flex-col items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 text-2xl">
              📷
            </div>
            <div>
              <div className="font-semibold text-white">Scan Mode</div>
              <div className="text-zinc-500 text-sm">Scene guidance</div>
            </div>
          </Link>
        </div>

        <p className="text-zinc-600 text-sm">
          Every second matters.
        </p>
      </div>
    </main>
  );
}
