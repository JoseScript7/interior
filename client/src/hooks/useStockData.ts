import { useQuery } from '@tanstack/react-query';
import { fetchQuotes, fetchCandles } from '../api/stockApi';

const STOCK_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

export function useStockQuotes() {
  return useQuery({
    queryKey: ['stockQuotes'],
    queryFn: () => fetchQuotes(STOCK_SYMBOLS),
    staleTime: 60_000,     // 1 minute
    refetchInterval: 120_000, // refetch every 2 minutes
  });
}

export function useStockCandles(symbol: string) {
  return useQuery({
    queryKey: ['stockCandles', symbol],
    queryFn: () => fetchCandles(symbol),
    staleTime: 300_000, // 5 minutes
    enabled: !!symbol,
  });
}

export { STOCK_SYMBOLS };
