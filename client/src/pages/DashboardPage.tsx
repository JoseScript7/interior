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
        backgroundColor: 'rgba(13, 110, 253, 0.7)', // Bootstrap primary
        borderColor: 'rgb(13, 110, 253)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  // Line chart data
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
        borderColor: 'rgb(13, 110, 253)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <>
      <div className="pricing-header px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center">
        <h1 className="display-4">Dashboard</h1>
        <p className="lead">
          Welcome back, {user?.name}. Monitor real-time stock prices and track trends using our interactive dashboard.
        </p>
        <RoleGate allowedRoles={['admin']}>
          <span className="badge bg-warning text-dark mt-2">Admin Access</span>
        </RoleGate>
      </div>

      <div className="container">
        {/* Pricing Cards adapted for Stock Stats */}
        <div className="row row-cols-1 row-cols-md-3 mb-3 text-center">
          {quotesLoading && <div className="col-12"><div className="spinner-border text-primary" /></div>}
          {quotesError && <div className="col-12 text-danger">Failed to load stock quotes</div>}
          
          {quotesData?.slice(0, 3).map(({ symbol, quote }) => (
            <div className="col" key={symbol}>
              <div className="card mb-4 box-shadow">
                <div className="card-header">
                  <h4 className="my-0 font-weight-normal">{symbol}</h4>
                </div>
                <div className="card-body">
                  <h1 className="card-title pricing-card-title">
                    ${quote.c.toFixed(2)}
                  </h1>
                  <ul className="list-unstyled mt-3 mb-4">
                    <li className={quote.d >= 0 ? 'text-success' : 'text-danger'}>
                      {quote.d >= 0 ? '▲' : '▼'} {Math.abs(quote.dp).toFixed(2)}% Today
                    </li>
                    <li>High: ${quote.h.toFixed(2)}</li>
                    <li>Low: ${quote.l.toFixed(2)}</li>
                    <li>Open: ${quote.o.toFixed(2)}</li>
                  </ul>
                  <button type="button" className="btn btn-lg btn-block btn-outline-primary w-100" onClick={() => setSelectedSymbol(symbol)}>
                    View Trend
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts in standard Bootstrap cards */}
        <div className="row mb-5">
          <div className="col-md-6 mb-4">
            <div className="card h-100 box-shadow">
              <div className="card-header">
                <h5 className="mb-0">Market Overview</h5>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                {quotesLoading && <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>}
                {!quotesLoading && !quotesError && quotesData && (
                  <Bar data={barChartData} options={barChartOptions} />
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card h-100 box-shadow">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedSymbol} Price Trend</h5>
                <select 
                  className="form-select form-select-sm w-auto" 
                  value={selectedSymbol} 
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                >
                  {STOCK_SYMBOLS.map(sym => <option key={sym} value={sym}>{sym}</option>)}
                </select>
              </div>
              <div className="card-body" style={{ height: '300px' }}>
                {candlesLoading && <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>}
                {!candlesLoading && !candlesError && candlesData?.s === 'ok' && (
                  <Line data={lineChartData} options={lineChartOptions} />
                )}
                {!candlesLoading && !candlesError && candlesData?.s !== 'ok' && (
                  <div className="text-center text-muted mt-5">No data available</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
