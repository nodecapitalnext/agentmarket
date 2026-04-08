/**
 * Otomatik Buyer Agent
 * Circle GatewayClient ile x402 korumalı API'lere gasless ödeme yapar
 * NOT: Buyer ve Seller farklı adresler olmalı (Gateway self_transfer yasak)
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, parseUnits } from "viem";
import { arcTestnet } from "../config/chains.js";

const SELLER_PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BASE_URL = process.env.API_URL || "http://localhost:4000";

if (!SELLER_PRIVATE_KEY) throw new Error("PRIVATE_KEY env eksik");

// Buyer için yeni ephemeral cüzdan oluştur (her çalıştırmada farklı)
// Ya da BUYER_PRIVATE_KEY env'den al
const BUYER_PRIVATE_KEY = (process.env.BUYER_PRIVATE_KEY as `0x${string}`) ?? generatePrivateKey();
const buyerAccount = privateKeyToAccount(BUYER_PRIVATE_KEY);

console.log("Buyer adresi:", buyerAccount.address);
console.log("Seller adresi:", privateKeyToAccount(SELLER_PRIVATE_KEY).address);

if (buyerAccount.address.toLowerCase() === privateKeyToAccount(SELLER_PRIVATE_KEY).address.toLowerCase()) {
  throw new Error("Buyer ve Seller aynı adres olamaz! BUYER_PRIVATE_KEY env'ini farklı bir cüzdan ile ayarla.");
}

const client = new GatewayClient({
  chain: "arcTestnet",
  privateKey: BUYER_PRIVATE_KEY,
});

// Seller cüzdanından buyer'a USDC transfer et (deposit için)
async function fundBuyer() {
  const sellerAccount = privateKeyToAccount(SELLER_PRIVATE_KEY);
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http() });
  const walletClient = createWalletClient({ account: sellerAccount, chain: arcTestnet, transport: http() });

  const USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;
  const ERC20_ABI = [
    { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
    { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  ] as const;

  const buyerBalance = await publicClient.readContract({ address: USDC, abi: ERC20_ABI, functionName: "balanceOf", args: [buyerAccount.address] });
  console.log(`Buyer USDC bakiyesi: ${Number(buyerBalance) / 1e6}`);

  if (buyerBalance < parseUnits("1", 6)) {
    console.log("Buyer'a 2 USDC transfer ediliyor...");
    const hash = await walletClient.writeContract({ address: USDC, abi: ERC20_ABI, functionName: "transfer", args: [buyerAccount.address, parseUnits("2", 6)] });
    console.log("Transfer tx:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transfer tamamlandı.");
  }
}

async function setup() {
  console.log("── Gateway Buyer Agent ──────────────────────");

  await fundBuyer();

  const balances = await client.getBalances();
  console.log(`Buyer Wallet USDC:  ${balances.wallet.formatted}`);
  console.log(`Buyer Gateway USDC: ${balances.gateway.formattedAvailable}`);

  if (balances.gateway.available < 500_000n) {
    console.log("\nGateway'e deposit yapılıyor (1 USDC)...");
    const deposit = await client.deposit("1");
    console.log(`Deposit tx: ${deposit.depositTxHash}`);
    console.log("Onaylanıyor...");
    await new Promise((r) => setTimeout(r, 8000));
    const after = await client.getBalances();
    console.log(`Gateway USDC (sonra): ${after.gateway.formattedAvailable}`);
  }
}

async function runPaymentLoop(count: number) {
  console.log(`\n── ${count} işlem başlatılıyor ──────────────────`);

  const cities = ["Istanbul", "London", "Tokyo", "NewYork", "Berlin", "Paris", "Dubai"];
  const symbols = ["BTC", "ETH", "SOL", "ARB"];
  const texts = [
    "Circle is a global financial technology firm that enables businesses to harness digital currencies.",
    "Arc is a Layer-1 blockchain designed for stablecoin-native transactions with sub-second finality.",
    "Nanopayments enable sub-cent transactions by batching thousands of payments into one onchain tx.",
  ];

  let success = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    const type = i % 3;
    try {
      if (type === 0) {
        const city = cities[i % cities.length];
        const { status } = await client.pay(`${BASE_URL}/api/weather?city=${city}`);
        console.log(`[${i + 1}/${count}] weather/${city} → ${status}`);
      } else if (type === 1) {
        const symbol = symbols[i % symbols.length];
        const { status } = await client.pay(`${BASE_URL}/api/price?symbol=${symbol}`);
        console.log(`[${i + 1}/${count}] price/${symbol} → ${status}`);
      } else {
        const pairs = [["USDC","EURC"], ["EURC","USDC"]];
        const pair = pairs[i % pairs.length];
        const { status } = await client.pay(`${BASE_URL}/api/fx?from=${pair[0]}&to=${pair[1]}&amount=100`);
        console.log(`[${i + 1}/${count}] fx/${pair[0]}-${pair[1]} → ${status}`);
      }
      success++;
    } catch (err: any) {
      console.error(`[${i + 1}/${count}] HATA: ${err?.message ?? err}`);
      failed++;
      if (failed === 1) break; // ilk hatada dur
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n── Sonuç: ${success} başarılı, ${failed} başarısız ──`);
  const final = await client.getBalances();
  console.log(`Buyer Gateway USDC kalan: ${final.gateway.formattedAvailable}`);
}

async function main() {
  await setup();
  await runPaymentLoop(60);
}

main().catch(console.error);
