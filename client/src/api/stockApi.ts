import type { StockQuote, StockCandles } from '../types';

const BASE = '/api/stocks';

export async function fetchQuote(symbol: string): Promise<StockQuote> {
  const res = await fetch(`${BASE}/quote?symbol=${encodeURIComponent(symbol)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch quote');
  }
  return res.json();
}

export async function fetchQuotes(symbols: string[]): Promise<{ symbol: string; quote: StockQuote }[]> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const quote = await fetchQuote(symbol);
      return { symbol, quote };
    })
  );
  return results;
}

export async function fetchCandles(symbol: string): Promise<StockCandles> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - 30 * 24 * 60 * 60; // 30 days ago
  const res = await fetch(
    `${BASE}/candles?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${now}`,
    { credentials: 'include' }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch candles');
  }
  return res.json();
}
