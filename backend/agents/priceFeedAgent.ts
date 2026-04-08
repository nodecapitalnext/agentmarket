// Kripto fiyat feed agent — CoinGecko public API
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
  SOL: "solana",
  ARB: "arbitrum",
};

export async function priceFeedAgent(symbol: string) {
  const id = COINGECKO_IDS[symbol.toUpperCase()] ?? "bitcoin";

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`
    );
    const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;
    const price = data[id];

    return {
      agent: "PriceFeedAgent",
      symbol: symbol.toUpperCase(),
      price_usd: price?.usd ?? 0,
      change_24h: price?.usd_24h_change?.toFixed(2) ?? "0",
      timestamp: new Date().toISOString(),
      priceUSDC: 0.001,
    };
  } catch {
    return {
      agent: "PriceFeedAgent",
      symbol: symbol.toUpperCase(),
      price_usd: 0,
      change_24h: "0",
      error: "Price feed unavailable",
      timestamp: new Date().toISOString(),
      priceUSDC: 0.001,
    };
  }
}
