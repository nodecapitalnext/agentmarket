"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Stats {
  total_transactions: number;
  total_usdc_volume: string;
  transactions_by_agent: Record<string, number>;
  recent: Array<{ agent: string; payer: string; amount: number; timestamp: string }>;
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<"online" | "offline" | "loading">("loading");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([
          fetch(`${API}/stats`).then((r) => r.json()),
          fetch(`${API}/health`).then((r) => r.json()),
        ]);
        setStats(s);
        setHealth(h.status === "ok" ? "online" : "offline");
      } catch {
        setHealth("offline");
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: "Total Transactions",
      value: stats?.total_transactions ?? 0,
      sub: "on Arc Testnet",
      color: "blue",
    },
    {
      label: "USDC Volume",
      value: `$${stats?.total_usdc_volume ?? "0.0000"}`,
      sub: "gasless via Nanopayments",
      color: "green",
    },
    {
      label: "Active Agents",
      value: Object.keys(stats?.transactions_by_agent ?? {}).length || 3,
      sub: "weather · price · summarize",
      color: "purple",
    },
    {
      label: "Network",
      value: "Arc Testnet",
      sub: health === "online" ? "● Online" : "○ Offline",
      color: health === "online" ? "green" : "red",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold mb-1">{c.value}</p>
            <p className={`text-xs ${c.color === "green" ? "text-green-400" : c.color === "red" ? "text-red-400" : "text-gray-500"}`}>
              {c.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Agent breakdown */}
      {stats && Object.keys(stats.transactions_by_agent).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Transactions by Agent</h3>
          <div className="space-y-3">
            {Object.entries(stats.transactions_by_agent).map(([agent, count]) => {
              const pct = Math.round((count / stats.total_transactions) * 100);
              return (
                <div key={agent}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{agent}</span>
                    <span className="text-gray-400">{count} txs</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Architecture */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Payment Flow</h3>
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {["Buyer Agent", "→", "x402 Request", "→", "Circle Gateway", "→", "EIP-3009 Sign", "→", "Arc Testnet", "→", "Seller API"].map((s, i) => (
            <span
              key={i}
              className={s === "→" ? "text-gray-600" : "px-3 py-1 bg-gray-800 rounded-lg text-gray-300"}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
