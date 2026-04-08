"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type AgentType = "weather" | "price" | "summarize" | "fx" | "sentiment";

const AGENTS = [
  { id: "weather" as AgentType, name: "Weather Agent", icon: "🌤", price: "$0.001", method: "GET" },
  { id: "price" as AgentType, name: "Price Feed Agent", icon: "📈", price: "$0.001", method: "GET" },
  { id: "summarize" as AgentType, name: "Summarize Agent", icon: "✍️", price: "$0.005", method: "POST" },
  { id: "fx" as AgentType, name: "FX Rate Agent", icon: "💱", price: "$0.002", method: "GET" },
  { id: "sentiment" as AgentType, name: "Sentiment Agent", icon: "🧠", price: "$0.002", method: "POST" },
];

export function AgentTester() {
  const [selected, setSelected] = useState<AgentType>("weather");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function callAgent() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let res: Response;
      if (selected === "weather") {
        res = await fetch(`${API}/api/weather?city=${input || "Istanbul"}`);
      } else if (selected === "price") {
        res = await fetch(`${API}/api/price?symbol=${input || "BTC"}`);
      } else if (selected === "fx") {
        const [from, to] = (input || "USDC/EURC").split("/");
        res = await fetch(`${API}/api/fx?from=${from || "USDC"}&to=${to || "EURC"}&amount=100`);
      } else if (selected === "sentiment") {
        res = await fetch(`${API}/api/sentiment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input || "Bitcoin is looking bullish today." }),
        });
      } else {
        res = await fetch(`${API}/api/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input || "Circle is a global financial technology firm." }),
        });
      }

      if (res.status === 402) {
        setError("402 Payment Required — Bu endpoint x402 korumalı. Buyer agent ile ödeme yapılmalı.");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("API bağlantı hatası. Backend çalışıyor mu?");
    } finally {
      setLoading(false);
    }
  }

  const agent = AGENTS.find((a) => a.id === selected)!;

  return (
    <div className="space-y-6">
      {/* Agent seçimi */}
      <div className="grid grid-cols-3 gap-3">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setSelected(a.id); setResult(null); setError(""); }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selected === a.id
                ? "border-blue-500 bg-blue-950/30"
                : "border-gray-800 bg-gray-900 hover:border-gray-600"
            }`}
          >
            <div className="text-2xl mb-2">{a.icon}</div>
            <div className="text-sm font-medium">{a.name}</div>
            <div className="text-xs text-gray-500 mt-1">{a.price} · {a.method}</div>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-2 block">
            {selected === "weather" && "City name"}
            {selected === "price" && "Token symbol (BTC, ETH, SOL...)"}
            {selected === "fx" && "Currency pair (USDC/EURC or EURC/USDC)"}
            {selected === "sentiment" && "Text to analyze"}
            {selected === "summarize" && "Text to summarize"}
          </label>
          {selected === "summarize" ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to summarize..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selected === "weather" ? "Istanbul" : selected === "price" ? "BTC" : selected === "fx" ? "USDC/EURC" : "BTC is bullish"}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        <button
          onClick={callAgent}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? "Calling agent..." : `Call ${agent.name} — ${agent.price}`}
        </button>

        {error && (
          <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-xl text-yellow-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2">Response</p>
            <pre className="text-xs text-green-400 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
