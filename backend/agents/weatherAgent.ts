// Hava durumu agent — gerçek API veya mock
export async function weatherAgent(city: string) {
  // Gerçek projede OpenWeatherMap API kullanılır
  // Demo için deterministik mock data
  const conditions = ["Sunny", "Cloudy", "Rainy", "Windy", "Partly Cloudy"];
  const seed = city.charCodeAt(0) % conditions.length;

  return {
    agent: "WeatherAgent",
    city,
    temperature: 15 + (city.charCodeAt(0) % 20),
    unit: "celsius",
    condition: conditions[seed],
    humidity: 40 + (city.charCodeAt(1) % 40),
    timestamp: new Date().toISOString(),
    priceUSDC: 0.001,
  };
}
