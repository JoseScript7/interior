/**
 * routes/stockRoutes.js
 */

const express = require('express');
const router = express.Router();

const stockController = require('../controllers/stockController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Stock quote (authenticated)
router.get('/api/stocks/quote', authenticateToken, stockController.getQuote);

// Stock candles (authenticated)
router.get('/api/stocks/candles', authenticateToken, stockController.getCandles);

// Market news (authenticated)
router.get('/api/stocks/market-news', authenticateToken, stockController.getMarketNews);

module.exports = router;
