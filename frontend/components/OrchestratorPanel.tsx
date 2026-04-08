"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Step {
  agent: string;
  cost_usdc: number;
  result: unknown;
}

interface OrchestratorResult {
  query: string;
  steps: Step[];
  total_cost_usdc: number;
  total_transactions: number;
  duration_ms: number;
}

const AGENT_ICONS: Record<string, string> = {
  PriceFeedAgent: "📈",
  WeatherAgent: "🌤",
  SentimentAgent: "🧠",
  AIChatAgent: "🤖",
};

const EXAMPLE_QUERIES = [
  "What is the BTC price and market sentiment today?",
  "How is the weather in Istanbul and what is ETH price?",
  "Analyze SOL price trend and summarize the market",
];

export function OrchestratorPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API}/api/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 to-purple-950 border border-blue-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔗</span>
          <h2 className="text-lg font-semibold">Agent Orchestrator</h2>
          <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full border border-blue-700">Agent-to-Agent</span>
        </div>
        <p className="text-sm text-gray-400">
          One query triggers a chain of AI agents. Each agent pays the next via Circle Nanopayments.
          Total cost: ~$0.014 USDC for 4 agents.
        </p>
      </div>

      {/* Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Your query</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Ask anything — agents will collaborate to answer..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => setQuery(q)}
              className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {q.slice(0, 45)}...
            </button>
          ))}
        </div>

        <button
          onClick={run}
          disabled={loading || !query.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              Running agent chain...
            </span>
          ) : "Run Orchestrator — ~$0.014 USDC"}
        </button>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">{error}</div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{result.total_transactions}</p>
              <p className="text-xs text-gray-500 mt-1">Agents called</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">${result.total_cost_usdc.toFixed(4)}</p>
              <p className="text-xs text-gray-500 mt-1">Total USDC paid</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{result.duration_ms}ms</p>
              <p className="text-xs text-gray-500 mt-1">Duration</p>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h3 className="font-medium text-sm">Agent Chain</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {result.steps.map((step, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{AGENT_ICONS[step.agent] ?? "🤖"}</span>
                      <span className="text-sm font-medium">{step.agent}</span>
                      <span className="text-xs text-gray-500">Step {i + 1}</span>
                    </div>
                    <span className="text-xs text-green-400 font-mono">${step.cost_usdc.toFixed(4)} USDC</span>
                  </div>
                  <pre className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3 overflow-auto max-h-32">
                    {JSON.stringify(step.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
