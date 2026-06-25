/**
 * controllers/stockController.js
 *
 * Server-side proxy for Finnhub API.
 * Keeps the API key hidden from the browser client.
 */

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

/**
 * GET /api/stocks/quote?symbol=AAPL
 */
const getQuote = async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol query parameter is required.' });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      return res.status(503).json({ error: 'Finnhub API key not configured.' });
    }

    const response = await fetch(
      `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Stock quote error:', err);
    res.status(500).json({ error: 'Failed to fetch stock quote.' });
  }
};

/**
 * GET /api/stocks/candles?symbol=AAPL&resolution=D&from=...&to=...
 */
const getCandles = async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol query parameter is required.' });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      return res.status(503).json({ error: 'Finnhub API key not configured.' });
    }

    const res_ = resolution || 'D';
    const now = Math.floor(Date.now() / 1000);
    const from_ = from || (now - 30 * 24 * 60 * 60); // default: 30 days ago
    const to_ = to || now;

    const response = await fetch(
      `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${res_}&from=${from_}&to=${to_}&token=${apiKey}`
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Stock candles error:', err);
    res.status(500).json({ error: 'Failed to fetch stock candles.' });
  }
};

/**
 * GET /api/stocks/market-news
 */
const getMarketNews = async (req, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey || apiKey === 'your_finnhub_api_key_here') {
      return res.status(503).json({ error: 'Finnhub API key not configured.' });
    }

    const response = await fetch(
      `${FINNHUB_BASE}/news?category=general&token=${apiKey}`
    );
    const data = await response.json();
    // Return top 10 news items
    res.status(200).json(Array.isArray(data) ? data.slice(0, 10) : data);
  } catch (err) {
    console.error('Market news error:', err);
    res.status(500).json({ error: 'Failed to fetch market news.' });
  }
};

module.exports = {
  getQuote,
  getCandles,
  getMarketNews
};
