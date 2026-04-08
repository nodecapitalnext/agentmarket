"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConnectWallet } from "@/components/ConnectWallet";
import { StatsPanel } from "@/components/StatsPanel";
import { AgentTester } from "@/components/AgentTester";
import { TxFeed } from "@/components/TxFeed";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";

const TABS = ["Overview", "Try Agents", "Subscriptions", "Transactions"] as const;
type Tab = typeof TABS[number];

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">A</div>
            <span className="font-semibold">AgentMarket</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 text-sm">Dashboard</span>
        </div>
        <ConnectWallet />
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl w-fit mb-8">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && <StatsPanel />}
        {tab === "Try Agents" && <AgentTester />}
        {tab === "Subscriptions" && <SubscriptionPanel />}
        {tab === "Transactions" && <TxFeed />}
      </div>
    </div>
  );
}
