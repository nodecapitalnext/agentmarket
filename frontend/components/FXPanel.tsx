"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FXResult {
  from: string;
  to: string;
  amount: number;
  rate: string;
  converted: string;
  fee: string;
  net_amount: string;
  settlement: string;
  fxescrow_contract: string;
  eurc_contract: string;
  tenor: string;
  timestamp: string;
}

interface Currency {
  symbol: string;
  name: string;
  address: string;
  type: string;
}

export function FXPanel() {
  const [from, setFrom] = useState("USDC");
  const [to, setTo] = useState("EURC");
  const [amount, setAmount] = useState("100");
  const [result, setResult] = useState<FXResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    fetch(`${API}/api/currencies`)
      .then((r) => r.json())
      .then((d) => setCurrencies(d.currencies ?? []))
      .catch(() => {});
  }, []);

  async function getQuote() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/fx?from=${from}&to=${to}&amount=${amount}`);
      if (res.status === 402) {
        alert("402 Payment Required — x402 korumalı endpoint. Buyer agent ile ödeme yapılmalı.");
        return;
      }
      setResult(await res.json());
    } catch {
      alert("API bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-950 to-blue-950 border border-green-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💱</span>
          <h2 className="text-lg font-semibold">StableFX Agent</h2>
          <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded-full border border-green-700">Circle StableFX</span>
        </div>
        <p className="text-sm text-gray-400">
          Real-time USDC/EURC exchange rates via Circle StableFX on Arc. Settlement via FxEscrow contract.
        </p>
      </div>

      {/* Currencies */}
      <div className="grid grid-cols-2 gap-3">
        {currencies.map((c) => (
          <div key={c.symbol} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{c.symbol === "USDC" ? "💵" : "💶"}</span>
              <span className="font-medium">{c.symbol}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "native_gas_token" ? "bg-blue-900/40 text-blue-400" : "bg-green-900/40 text-green-400"}`}>
                {c.type === "native_gas_token" ? "gas token" : "ERC-20"}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{c.address.slice(0, 10)}...{c.address.slice(-8)}</p>
          </div>
        ))}
      </div>

      {/* FX Calculator */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-medium text-sm text-gray-400">Get FX Quote — $0.002 USDC</h3>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
            </select>
          </div>

          <button
            onClick={swap}
            className="mt-5 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ⇄
          </button>

          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="EURC">EURC</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={getQuote}
          disabled={loading}
          className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
        >
          {loading ? "Getting quote..." : `Get FX Quote — $0.002 USDC`}
        </button>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Exchange Rate</p>
                <p className="text-xl font-bold">1 {result.from} = {result.rate} {result.to}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">You receive</p>
                <p className="text-xl font-bold text-green-400">{result.net_amount} {result.to}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Converted</span>
                <span>{result.converted} {result.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fee (0.1%)</span>
                <span className="text-red-400">-{result.fee} {result.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Settlement</span>
                <span className="text-green-400">{result.tenor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">FxEscrow</span>
                <a
                  href={`https://testnet.arcscan.app/address/${result.fxescrow_contract}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 font-mono text-xs hover:underline"
                >
                  {result.fxescrow_contract.slice(0, 10)}...
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
