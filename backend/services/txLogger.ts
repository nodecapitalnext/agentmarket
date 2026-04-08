// İşlem logları — hackathon için 50+ tx kanıtı
interface TxRecord {
  agent: string;
  payer: string;
  amount: number;
  timestamp: string;
}

class TxLogger {
  private logs: TxRecord[] = [];

  log(agent: string, payer: string, amount: number) {
    this.logs.push({
      agent,
      payer,
      amount,
      timestamp: new Date().toISOString(),
    });
  }

  getStats() {
    const total = this.logs.reduce((sum, l) => sum + l.amount, 0);
    const byAgent = this.logs.reduce<Record<string, number>>((acc, l) => {
      acc[l.agent] = (acc[l.agent] ?? 0) + 1;
      return acc;
    }, {});

    return {
      total_transactions: this.logs.length,
      total_usdc_volume: total.toFixed(4),
      transactions_by_agent: byAgent,
      recent: this.logs.slice(-10).reverse(),
    };
  }

  getAll() {
    return this.logs;
  }
}

export const txLogger = new TxLogger();
