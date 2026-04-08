"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TxRecord {
  agent: string;
  payer: string;
  amount: number;
  timestamp: string;
}

interface GatewayTx {
  id: string;
  status: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  createdAt: string;
}

const AGENT_ICONS: Record<string, string> = {
  weather: "🌤",
  price: "📈",
  summarize: "✍️",
};

const STATUS_COLOR: Record<string, string> = {
  received: "text-yellow-400",
  batched: "text-blue-400",
  confirmed: "text-blue-400",
  completed: "text-green-400",
  failed: "text-red-400",
};

export function TxFeed() {
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [gatewayTxs, setGatewayTxs] = useState<GatewayTx[]>([]);
  const [tab, setTab] = useState<"local" | "gateway">("gateway");
  const [sellerCount, setSellerCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, transfers] = await Promise.all([
          fetch(`${API}/stats`).then((r) => r.json()),
          fetch(`${API}/transfers`).then((r) => r.json()),
        ]);
        setTxs(stats.recent ?? []);
        setGatewayTxs(transfers.recent_buyer ?? []);
        setSellerCount(transfers.seller_received ?? 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{sellerCount}</p>
          <p className="text-xs text-gray-500 mt-1">Seller received (Arc)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{gatewayTxs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Buyer sent (Gateway)</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{txs.length}</p>
          <p className="text-xs text-gray-500 mt-1">API calls (session)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-4">
          <button
            onClick={() => setTab("gateway")}
            className={`text-sm font-medium transition-colors ${tab === "gateway" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Gateway Transactions (Arc Testnet)
          </button>
          <button
            onClick={() => setTab("local")}
            className={`text-sm font-medium transition-colors ${tab === "local" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            Session Log
          </button>
        </div>

        {tab === "gateway" && (
          gatewayTxs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              No Gateway transactions yet. Run the buyer agent.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {gatewayTxs.map((tx) => (
                <div key={tx.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-300">{tx.id.slice(0, 16)}...</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.fromAddress.slice(0, 8)}...{tx.fromAddress.slice(-6)} → {tx.toAddress.slice(0, 8)}...{tx.toAddress.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${STATUS_COLOR[tx.status] ?? "text-gray-400"}`}>
                      {tx.status}
                    </p>
                    <p className="text-xs text-gray-500">${(Number(tx.amount) / 1e6).toFixed(4)} USDC</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "local" && (
          txs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              No session transactions yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {txs.map((tx, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{AGENT_ICONS[tx.agent] ?? "🤖"}</span>
                    <div>
                      <p className="text-sm font-medium capitalize">{tx.agent} agent</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {tx.payer.slice(0, 8)}...{tx.payer.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-400">${tx.amount.toFixed(4)} USDC</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleTimeString("tr-TR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
