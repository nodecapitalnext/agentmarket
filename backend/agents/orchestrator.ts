/**
 * Agent Orchestrator — Agent-to-Agent Payment Loop
 * 
 * Bir "master agent" diğer agent API'lerini satın alır,
 * sonuçları birleştirip kullanıcıya sunar.
 * Her adım ayrı bir x402 ödeme tetikler.
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";

const BASE_URL = process.env.API_URL || "http://localhost:4000";

export interface OrchestratorResult {
  query: string;
  steps: OrchestratorStep[];
  total_cost_usdc: number;
  total_transactions: number;
  duration_ms: number;
}

export interface OrchestratorStep {
  agent: string;
  cost_usdc: number;
  result: unknown;
  tx_id?: string;
}

export async function runOrchestrator(
  query: string,
  buyerPrivateKey: `0x${string}`
): Promise<OrchestratorResult> {
  const client = new GatewayClient({
    chain: "arcTestnet",
    privateKey: buyerPrivateKey,
  });

  const start = Date.now();
  const steps: OrchestratorStep[] = [];

  // Step 1: Fiyat verisi al ($0.001)
  try {
    const symbol = extractSymbol(query);
    const { data } = await client.pay(`${BASE_URL}/api/price?symbol=${symbol}`);
    steps.push({ agent: "PriceFeedAgent", cost_usdc: 0.001, result: data });
  } catch (e: any) {
    steps.push({ agent: "PriceFeedAgent", cost_usdc: 0, result: { error: e.message } });
  }

  // Step 2: Hava durumu al ($0.001)
  try {
    const city = extractCity(query);
    const { data } = await client.pay(`${BASE_URL}/api/weather?city=${city}`);
    steps.push({ agent: "WeatherAgent", cost_usdc: 0.001, result: data });
  } catch (e: any) {
    steps.push({ agent: "WeatherAgent", cost_usdc: 0, result: { error: e.message } });
  }

  // Step 3: Sentiment analizi ($0.002)
  try {
    const { data } = await client.pay(`${BASE_URL}/api/sentiment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query }),
    });
    steps.push({ agent: "SentimentAgent", cost_usdc: 0.002, result: data });
  } catch (e: any) {
    steps.push({ agent: "SentimentAgent", cost_usdc: 0, result: { error: e.message } });
  }

  // Step 4: AI özet ($0.01)
  try {
    const context = steps.map(s => `${s.agent}: ${JSON.stringify(s.result)}`).join("\n");
    const { data } = await client.pay(`${BASE_URL}/api/ai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: `Based on this data, answer: "${query}"\n\nData:\n${context}` }),
    });
    steps.push({ agent: "AIChatAgent", cost_usdc: 0.01, result: data });
  } catch (e: any) {
    steps.push({ agent: "AIChatAgent", cost_usdc: 0, result: { error: e.message } });
  }

  const total_cost_usdc = steps.reduce((sum, s) => sum + s.cost_usdc, 0);

  return {
    query,
    steps,
    total_cost_usdc,
    total_transactions: steps.filter(s => s.cost_usdc > 0).length,
    duration_ms: Date.now() - start,
  };
}

function extractSymbol(query: string): string {
  const symbols = ["BTC", "ETH", "SOL", "ARB", "USDC"];
  for (const s of symbols) {
    if (query.toUpperCase().includes(s)) return s;
  }
  return "BTC";
}

function extractCity(query: string): string {
  const cities = ["Istanbul", "London", "Tokyo", "NewYork", "Berlin", "Paris", "Dubai"];
  for (const c of cities) {
    if (query.toLowerCase().includes(c.toLowerCase())) return c;
  }
  return "Istanbul";
}
