import express from "express";
import cors from "cors";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { weatherAgent } from "./agents/weatherAgent.js";
import { priceFeedAgent } from "./agents/priceFeedAgent.js";
import { summarizeAgent } from "./agents/summarizeAgent.js";
import { aiChatAgent, sentimentAgent } from "./agents/aiAgent.js";
import { runOrchestrator } from "./agents/orchestrator.js";
import { fxRateAgent, getSupportedCurrencies } from "./agents/fxAgent.js";
import { txLogger } from "./services/txLogger.js";

const app = express();
app.use(cors());
app.use(express.json());

const SELLER_ADDRESS = process.env.SELLER_ADDRESS as `0x${string}`;
if (!SELLER_ADDRESS) throw new Error("SELLER_ADDRESS env eksik");

const gateway = createGatewayMiddleware({
  sellerAddress: SELLER_ADDRESS,
  networks: ["eip155:5042002"],
});

// ─── Free endpoints ────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: "Arc Testnet", chainId: 5042002 });
});

app.get("/stats", (_req, res) => {
  res.json(txLogger.getStats());
});

app.get("/transfers", async (_req, res) => {
  try {
    const { GatewayClient } = await import("@circle-fin/x402-batching/client");
    const client = new GatewayClient({ chain: "arcTestnet", privateKey: process.env.PRIVATE_KEY as `0x${string}` });
    const buyerClient = new GatewayClient({ chain: "arcTestnet", privateKey: process.env.BUYER_PRIVATE_KEY as `0x${string}` });
    const [sellerTxs, buyerTxs] = await Promise.all([
      client.searchTransfers({ to: client.address }),
      buyerClient.searchTransfers({ from: buyerClient.address }),
    ]);
    res.json({
      seller_received: sellerTxs.transfers.length,
      buyer_sent: buyerTxs.transfers.length,
      recent_seller: sellerTxs.transfers.slice(0, 10),
      recent_buyer: buyerTxs.transfers.slice(0, 10),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Paid Agent APIs ───────────────────────────────────────────────────────

// 1. Weather — $0.001
app.get("/api/weather", gateway.require("$0.001"), async (req, res) => {
  const city = (req.query.city as string) || "Istanbul";
  const result = await weatherAgent(city);
  txLogger.log("weather", req.payment?.payer ?? "unknown", 0.001);
  res.json(result);
});

// 2. Price Feed — $0.001
app.get("/api/price", gateway.require("$0.001"), async (req, res) => {
  const symbol = (req.query.symbol as string) || "BTC";
  const result = await priceFeedAgent(symbol);
  txLogger.log("price", req.payment?.payer ?? "unknown", 0.001);
  res.json(result);
});

// 3. Summarize — $0.005
app.post("/api/summarize", gateway.require("$0.005"), async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ error: "text required" });
  const result = await summarizeAgent(text);
  txLogger.log("summarize", req.payment?.payer ?? "unknown", 0.005);
  res.json(result);
});

// 4. AI Chat — $0.01
app.post("/api/ai-chat", gateway.require("$0.01"), async (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  const result = await aiChatAgent(prompt);
  txLogger.log("ai-chat", req.payment?.payer ?? "unknown", 0.01);
  res.json(result);
});

// 5. Sentiment — $0.002
app.post("/api/sentiment", gateway.require("$0.002"), async (req, res) => {
  const { text } = req.body as { text: string };
  if (!text) return res.status(400).json({ error: "text required" });
  const result = await sentimentAgent(text);
  txLogger.log("sentiment", req.payment?.payer ?? "unknown", 0.002);
  res.json(result);
});

// 6. Orchestrator — agent-to-agent loop (free entry, paid internally)
app.post("/api/orchestrate", async (req, res) => {
  const { query } = req.body as { query: string };
  if (!query) return res.status(400).json({ error: "query required" });
  const buyerKey = process.env.BUYER_PRIVATE_KEY as `0x${string}`;
  if (!buyerKey) return res.status(500).json({ error: "BUYER_PRIVATE_KEY missing" });
  try {
    const result = await runOrchestrator(query, buyerKey);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 7. FX Rate Agent — USDC/EURC StableFX — free (demo)
app.get("/api/fx", async (req, res) => {
  const from = (req.query.from as string) || "USDC";
  const to = (req.query.to as string) || "EURC";
  const amount = parseFloat((req.query.amount as string) || "100");
  const result = await fxRateAgent(from, to, amount);
  res.json(result);
});

// 8. Supported currencies — ücretsiz
app.get("/api/currencies", (_req, res) => {
  res.json(getSupportedCurrencies());
});

// ─── Type augmentation ─────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      payment?: { payer: string; amount: string; network: string };
    }
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AgentMarket API → http://localhost:${PORT}`);
  console.log(`Seller: ${SELLER_ADDRESS}`);
  console.log("  GET  /api/weather     → $0.001");
  console.log("  GET  /api/price       → $0.001");
  console.log("  POST /api/summarize   → $0.005");
  console.log("  POST /api/ai-chat     → $0.010");
  console.log("  POST /api/sentiment   → $0.002");
  console.log("  POST /api/orchestrate → agent-to-agent loop");
});
