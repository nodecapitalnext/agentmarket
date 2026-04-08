import OpenAI from "openai";

// OpenAI API key yoksa mock mode
const hasMock = !process.env.OPENAI_API_KEY;

const openai = hasMock ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function aiChatAgent(prompt: string) {
  if (hasMock) {
    // Mock response — OpenAI key olmadan da çalışır
    return {
      agent: "AIChatAgent",
      model: "gpt-4o-mini (mock)",
      prompt: prompt.slice(0, 80),
      response: `[Mock] This is a simulated AI response to: "${prompt.slice(0, 60)}". In production, this uses GPT-4o-mini via OpenAI API.`,
      tokens_used: 42,
      timestamp: new Date().toISOString(),
      priceUSDC: 0.01,
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
  });

  return {
    agent: "AIChatAgent",
    model: "gpt-4o-mini",
    prompt: prompt.slice(0, 80),
    response: completion.choices[0].message.content,
    tokens_used: completion.usage?.total_tokens ?? 0,
    timestamp: new Date().toISOString(),
    priceUSDC: 0.01,
  };
}

export async function sentimentAgent(text: string) {
  if (hasMock) {
    const words = text.toLowerCase();
    const positive = ["good", "great", "excellent", "bullish", "up", "gain"].some(w => words.includes(w));
    const negative = ["bad", "crash", "bearish", "down", "loss", "fear"].some(w => words.includes(w));
    return {
      agent: "SentimentAgent",
      text: text.slice(0, 80),
      sentiment: positive ? "POSITIVE" : negative ? "NEGATIVE" : "NEUTRAL",
      confidence: 0.82,
      timestamp: new Date().toISOString(),
      priceUSDC: 0.002,
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Analyze sentiment of this text. Reply with JSON only: {"sentiment": "POSITIVE|NEGATIVE|NEUTRAL", "confidence": 0.0-1.0}\n\nText: ${text}`
    }],
    max_tokens: 50,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content ?? "{}");
  return {
    agent: "SentimentAgent",
    text: text.slice(0, 80),
    sentiment: result.sentiment ?? "NEUTRAL",
    confidence: result.confidence ?? 0.5,
    timestamp: new Date().toISOString(),
    priceUSDC: 0.002,
  };
}
