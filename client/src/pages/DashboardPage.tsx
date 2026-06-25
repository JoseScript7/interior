import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useStockQuotes, useStockCandles, STOCK_SYMBOLS } from '../hooks/useStockData';
import { useAuthStore } from '../store/authStore';
import RoleGate from '../components/RoleGate';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  const { data: quotesData, isLoading: quotesLoading, isError: quotesError, error: quotesErr } = useStockQuotes();
  const { data: candlesData, isLoading: candlesLoading, isError: candlesError, error: candlesErr } = useStockCandles(selectedSymbol);

  // Bar chart data — current prices
  const barChartData = {
    labels: quotesData?.map((q) => q.symbol) ?? [],
    datasets: [
      {
        label: 'Current Price ($)',
        data: quotesData?.map((q) => q.quote.c) ?? [],
        backgroundColor: [
          'rgba(217, 119, 6, 0.7)',
          'rgba(234, 88, 12, 0.7)',
          'rgba(180, 83, 9, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(251, 191, 36, 0.7)',
        ],
        borderColor: [
          'rgb(217, 119, 6)',
          'rgb(234, 88, 12)',
          'rgb(180, 83, 9)',
          'rgb(245, 158, 11)',
          'rgb(251, 191, 36)',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Stock Prices Comparison', font: { size: 14, weight: 'bold' as const }, color: '#1C1917' },
    },
    scales: {
      y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#78716C' } },
      x: { grid: { display: false }, ticks: { color: '#1C1917', font: { weight: 'bold' as const } } },
    },
  };

  // Line chart data — 30-day price trend
  const lineLabels = candlesData?.t?.map((ts) => {
    const d = new Date(ts * 1000);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }) ?? [];

  const lineChartData = {
    labels: lineLabels,
    datasets: [
      {
        label: `${selectedSymbol} Close Price`,
        data: candlesData?.c ?? [],
        borderColor: 'rgb(217, 119, 6)',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: `${selectedSymbol} — 30 Day Trend`, font: { size: 14, weight: 'bold' as const }, color: '#1C1917' },
    },
    scales: {
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#78716C' } },
      x: { grid: { display: false }, ticks: { color: '#78716C', maxRotation: 45 } },
    },
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
        <RoleGate allowedRoles={['admin']}>
          <span className="role-badge role-admin">Admin Access</span>
        </RoleGate>
      </div>

      {/* Bar Chart — Stock Price Comparison */}
      <div className="card">
        <h2 className="card-title">Market Overview</h2>
        <p className="card-desc">Real-time stock prices for top companies</p>
        <div className="chart-container">
          {quotesLoading && (
            <div className="chart-loading">
              <div className="spinner" />
              <p>Fetching stock quotes…</p>
            </div>
          )}
          {quotesError && (
            <div className="chart-error">
              <p>⚠ Failed to load quotes</p>
              <p className="error-detail">{quotesErr instanceof Error ? quotesErr.message : 'Unknown error'}</p>
            </div>
          )}
          {!quotesLoading && !quotesError && quotesData && (
            <Bar data={barChartData} options={barChartOptions} />
          )}
        </div>
      </div>

      {/* Line Chart — Price Trend */}
      <div className="card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Price Trend</h2>
            <p className="card-desc">30-day closing price history</p>
          </div>
          <div className="symbol-selector">
            {STOCK_SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setSelectedSymbol(sym)}
                className={`chip ${sym === selectedSymbol ? 'chip-active' : ''}`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          {candlesLoading && (
            <div className="chart-loading">
              <div className="spinner" />
              <p>Fetching candle data…</p>
            </div>
          )}
          {candlesError && (
            <div className="chart-error">
              <p>⚠ Failed to load price data</p>
              <p className="error-detail">{candlesErr instanceof Error ? candlesErr.message : 'Unknown error'}</p>
            </div>
          )}
          {!candlesLoading && !candlesError && candlesData && candlesData.s === 'ok' && (
            <Line data={lineChartData} options={lineChartOptions} />
          )}
          {!candlesLoading && !candlesError && candlesData && candlesData.s !== 'ok' && (
            <div className="chart-error">
              <p>No candle data available for {selectedSymbol}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats from Quotes */}
      {quotesData && !quotesLoading && (
        <div className="stats-grid">
          {quotesData.map(({ symbol, quote }) => (
            <div className="stat-card" key={symbol}>
              <span className="stat-symbol">{symbol}</span>
              <span className="stat-price">${quote.c.toFixed(2)}</span>
              <span className={`stat-change ${quote.d >= 0 ? 'positive' : 'negative'}`}>
                {quote.d >= 0 ? '▲' : '▼'} {Math.abs(quote.dp).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
