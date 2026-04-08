import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">A</div>
          <span className="font-semibold text-lg">AgentMarket</span>
          <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded-full border border-blue-800">Arc Testnet</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <ConnectWallet />
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-blue-950 border border-blue-800 rounded-full text-blue-400 mb-6">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
          Powered by Circle Nanopayments + Arc
        </div>

        <h1 className="text-5xl font-bold mb-6 leading-tight">
          AI Agent API Marketplace<br />
          <span className="text-blue-400">$0.001 per request</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          AI agents buy and sell data in real time. Every API call costs $0.001 USDC,
          settled gaslessly on Arc via Circle Nanopayments.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
          >
            Open Dashboard
          </Link>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-xl font-medium transition-colors text-gray-300"
          >
            View on ArcScan ↗
          </a>
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "🌤",
            title: "Weather Agent",
            desc: "Real-time weather data for any city",
            price: "$0.001 / call",
            color: "blue",
          },
          {
            icon: "📈",
            title: "Price Feed Agent",
            desc: "Live crypto prices via CoinGecko",
            price: "$0.001 / call",
            color: "green",
          },
          {
            icon: "✍️",
            title: "Summarize Agent",
            desc: "AI-powered text summarization",
            price: "$0.005 / call",
            color: "purple",
          },
        ].map((f) => (
          <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-gray-400 mb-3">{f.desc}</p>
            <span className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300">{f.price}</span>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="border-t border-gray-800 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Deposit USDC", desc: "One-time deposit into Circle Gateway Wallet" },
              { step: "2", title: "Request API", desc: "Agent calls any protected endpoint" },
              { step: "3", title: "Sign & Pay", desc: "EIP-3009 offchain signature — zero gas" },
              { step: "4", title: "Settle on Arc", desc: "Gateway batches & settles on Arc Testnet" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold mx-auto mb-3">{s.step}</div>
                <h4 className="font-medium mb-1">{s.title}</h4>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
