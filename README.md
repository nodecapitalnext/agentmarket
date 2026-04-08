# AgentMarket

> AI Agent API Marketplace — Per-action USDC payments via Circle Nanopayments + x402 on Arc Testnet

Built for the **Agentic Economy on Arc** hackathon (lablab.ai · April 2026)

## What it does

AgentMarket is an on-chain API marketplace where AI agents buy and sell data in real time. Every API call costs **$0.001 USDC**, settled gaslessly on Arc via Circle Nanopayments — no gas overhead, no batching delays, no intermediaries.

**Track: Per-API Monetization Engine**

## Why this matters

Traditional gas costs make sub-cent transactions economically unviable:
- Ethereum: ~$0.50–$5.00 per tx → impossible at $0.001/call
- Arc + Circle Nanopayments: ~$0.000 effective gas → viable at any frequency

## Architecture

```
Buyer Agent (GatewayClient)
    ↓  EIP-3009 offchain signature (zero gas)
x402 HTTP Request
    ↓
Express API (createGatewayMiddleware)
    ↓  verify + settle
Circle Gateway → batched onchain settlement
    ↓
Arc Testnet (eip155:5042002)
```

## Agent APIs

| Endpoint | Price | Description |
|---|---|---|
| `GET /api/weather?city=Istanbul` | $0.001 USDC | Real-time weather data |
| `GET /api/price?symbol=BTC` | $0.001 USDC | Live crypto prices |
| `POST /api/summarize` | $0.005 USDC | AI text summarization |

## Tech Stack

- **Arc Testnet** — EVM-compatible L1, USDC as native gas token
- **Circle Nanopayments** — gasless batched USDC settlement via Gateway
- **x402 protocol** — HTTP 402 Payment Required standard
- **Circle Gateway** — EIP-3009 offchain authorization + batch settlement
- **PayStream contract** — on-chain recurring subscription payments
- **Next.js** — dashboard frontend
- **Hardhat** — smart contract development

## Deployed Contracts (Arc Testnet)

| Contract | Address |
|---|---|
| PayStream | `0x795d9ee6BBD625beB8000675E9e950625d5EB8B6` |
| USDC | `0x3600000000000000000000000000000000000000` |

## On-chain Proof

- **50+ Gateway transactions** on Arc Testnet (eip155:5042002)
- Buyer: `0x85E203253b9fEff08b4DEdf574E2D2c2600F48c9`
- Seller: `0xBDbdE02EeD6894fe111563c109Ccd66Ad5969464`
- Explorer: [testnet.arcscan.app](https://testnet.arcscan.app)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/nodecapitalnext/agentmarket
cd agentmarket

# 2. Setup env
cp .env.example .env
# Fill in PRIVATE_KEY, BUYER_PRIVATE_KEY

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Start frontend
cd frontend && npm install && npm run dev

# 5. Run buyer agent (generates 60 txs)
cd backend && npm run buyer
```

## Circle Products Used

- Arc (settlement layer)
- USDC (native gas + payment token)
- Circle Nanopayments (`@circle-fin/x402-batching`)
- Circle Gateway (EIP-3009 batch settlement)
