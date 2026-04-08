// Metin özetleme agent
export async function summarizeAgent(text: string) {
  // Gerçek projede OpenAI/Anthropic API kullanılır
  // Demo: ilk 2 cümleyi özet olarak döndür
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .filter(Boolean);

  const summary =
    sentences.length > 2
      ? sentences.slice(0, 2).join(" ") + "..."
      : text.slice(0, 150) + (text.length > 150 ? "..." : "");

  return {
    agent: "SummarizeAgent",
    original_length: text.length,
    summary_length: summary.length,
    summary,
    compression_ratio: ((1 - summary.length / text.length) * 100).toFixed(1) + "%",
    timestamp: new Date().toISOString(),
    priceUSDC: 0.005,
  };
}
