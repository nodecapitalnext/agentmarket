import express from "express";
import cors from "cors";
import { createGatewayMiddleware } from "@circle-fin/x402-batching/server";
import { weatherAgent } from "./agents/weatherAgent.js";
import { priceFeedAgent } from "./agents/priceFeedAgent.js";
import { summarizeAgent } from "./agents/summarizeAgent.js";
import { txLogger } from "./services/txLogger.js";

const app = express();
app.use(cors());
app.use(express.json());

const SELLER_ADDRESS = process.env.SELLER_ADDRESS as `0x${string}`;
if (!SELLER_ADDRESS) throw new Error("SELLER_ADDRESS env eksik");

// Circle Gateway middleware — Arc Testnet'e kilitli
const gateway = createGatewayMiddleware({
  sellerAddress: SELLER_ADDRESS,
  networks: ["eip155:5042002"],
});

// ─── Sağlık kontrolü (ücretsiz) ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", network: "Arc Testnet", chainId: 5042002 });
});

// ─── İşlem istatistikleri (ücretsiz) ──────────────────────────────────────
app.get("/stats", (_req, res) => {
  res.json(txLogger.getStats());
});

// ─── Gateway transfer geçmişi (ücretsiz) ──────────────────────────────────
app.get("/transfers", async (_req, res) => {
  try {
    const { GatewayClient } = await import("@circle-fin/x402-batching/client");
    const client = new GatewayClient({
      chain: "arcTestnet",
      privateKey: process.env.PRIVATE_KEY as `0x${string}`,
    });
    const buyerKey = process.env.BUYER_PRIVATE_KEY as `0x${string}`;
    const buyerClient = new GatewayClient({ chain: "arcTestnet", privateKey: buyerKey });
    const [sellerTxs, buyerTxs] = await Promise.all([
      client.searchTransfers({ to: client.address }),
      buyerClient.searchTransfers({ from: buyerClient.address }),
    ]);
    res.json({
      seller_received: sellerTxs.transfers.length,
      buyer_sent: buyerTxs.transfers.length,
      recent_seller: sellerTxs.transfers.slice(0, 5),
      recent_buyer: buyerTxs.transfers.slice(0, 5),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Ücretli Agent API'leri ($0.001 USDC / istek) ─────────────────────────

// 1. Hava durumu agent'ı
app.get(
  "/api/weather",
  gateway.require("$0.001"),
  async (req, res) => {
    const city = (req.query.city as string) || "Istanbul";
    const result = await weatherAgent(city);
    txLogger.log("weather", req.payment?.payer ?? "unknown", 0.001);
    res.json(result);
  }
);

// 2. Kripto fiyat feed agent'ı
app.get(
  "/api/price",
  gateway.require("$0.001"),
  async (req, res) => {
    const symbol = (req.query.symbol as string) || "BTC";
    const result = await priceFeedAgent(symbol);
    txLogger.log("price", req.payment?.payer ?? "unknown", 0.001);
    res.json(result);
  }
);

// 3. Metin özetleme agent'ı
app.post(
  "/api/summarize",
  gateway.require("$0.005"),
  async (req, res) => {
    const { text } = req.body as { text: string };
    if (!text) return res.status(400).json({ error: "text gerekli" });
    const result = await summarizeAgent(text);
    txLogger.log("summarize", req.payment?.payer ?? "unknown", 0.005);
    res.json(result);
  }
);

// ─── x402 tip tanımı ──────────────────────────────────────────────────────
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
  console.log("Routes:");
  console.log("  GET  /api/weather?city=Istanbul   → $0.001 USDC");
  console.log("  GET  /api/price?symbol=BTC        → $0.001 USDC");
  console.log("  POST /api/summarize               → $0.005 USDC");
});
