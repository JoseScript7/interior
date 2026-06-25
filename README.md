# StockPulse — Full-Stack Login MVC + React SPA

A full-stack web application featuring a **React + TypeScript** SPA frontend and a **Node.js + Express + SQLite** backend. Built with JWT authentication, role-based access control, real-time stock charts, and a feedback system.

## Features

- **React SPA Frontend** with TypeScript (strict mode, no `any`)
- **JWT Auth** — httpOnly cookie-based, no localStorage (XSS-safe)
- **Role-Based Access Control (RBAC)** — admin vs user routes/content
- **Stock Charts** — Bar + Line charts via Chart.js, data from Finnhub API
- **Data Fetching** — TanStack Query with loading/error states, caching, auto-refresh
- **Form Validation** — React Hook Form + Zod with inline error messages
- **State Management** — Zustand for auth state
- **Warm Studio Theme** — Cream/amber palette, Inter font, rounded corners
- **SQLite Persistence** — Users + feedback stored in `database.sqlite`
- **Dual-Mode API** — EJS browser forms + REST JSON API (backwards-compatible)

## Folder Structure

```
NodeLogin/
 ├── client/                → React + TypeScript SPA (Vite)
 │    ├── src/
 │    │   ├── api/          → API helper functions (auth, stock, feedback)
 │    │   ├── components/   → Layout, ProtectedRoute, RoleGate
 │    │   ├── hooks/        → TanStack Query hooks (useStockData, useFeedback)
 │    │   ├── pages/        → LoginPage, RegisterPage, DashboardPage, FeedbackPage, AdminPage
 │    │   ├── schemas/      → Zod validation schemas
 │    │   ├── store/        → Zustand auth store
 │    │   ├── types/        → Shared TypeScript interfaces
 │    │   ├── App.tsx       → React Router setup
 │    │   ├── main.tsx      → Entry point + QueryClientProvider
 │    │   └── index.css     → Warm Studio theme
 │    └── vite.config.ts    → Dev proxy to Express backend
 ├── controllers/           → Express route handlers
 ├── middleware/             → JWT auth + RBAC middleware
 ├── models/                → SQLite query functions
 ├── routes/                → Express route definitions
 ├── views/                 → EJS templates (legacy browser flow)
 ├── database.js            → SQLite initialization + seeding
 ├── app.js                 → Express entry point
 ├── .env                   → API keys (not committed)
 └── package.json
```

## Quick Start

```bash
# 1. Install backend dependencies
cd NodeLogin
npm install

# 2. Install frontend dependencies
cd client
npm install
cd ..

# 3. Add your Finnhub API key to .env
# FINNHUB_API_KEY=your_key_here

# 4. Start backend (Terminal 1)
npm start

# 5. Start frontend (Terminal 2)
cd client
npm run dev
```

Then open **http://localhost:5173**

## Default Admin Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin@123 | admin |

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 19 + TypeScript | Component-based UI |
| Build Tool | Vite | Fast dev server + HMR |
| Routing | React Router v7 | SPA page navigation |
| State Management | Zustand | Global auth state |
| Data Fetching | TanStack Query | Caching, loading/error states |
| Charts | Chart.js + react-chartjs-2 | Bar and Line charts |
| Form Validation | React Hook Form + Zod | Type-safe forms with inline errors |
| CSS | Vanilla CSS (Warm Studio) | Custom theme, no framework |
| Backend | Express.js | REST API server |
| Database | SQLite (better-sqlite3) | Persistent storage |
| Auth | JWT (jsonwebtoken) | httpOnly cookie tokens |
| Password Security | bcryptjs | Hash + compare |
| Stock Data | Finnhub API | Real-time stock quotes + candles |

## REST API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/register` | No | — | Register new user |
| POST | `/api/login` | No | — | Login, receive JWT cookie |
| GET | `/api/auth/check` | JWT | — | Verify current auth status |
| POST | `/api/logout` | No | — | Clear JWT cookie |
| GET | `/api/profile` | JWT | — | Get current user profile |
| GET | `/api/stocks/quote` | JWT | — | Stock quote (Finnhub proxy) |
| GET | `/api/stocks/candles` | JWT | — | Stock candle data (Finnhub proxy) |
| GET | `/api/stocks/market-news` | JWT | — | Market news (Finnhub proxy) |
| POST | `/api/feedback` | JWT | — | Submit feedback |
| GET | `/api/feedback` | JWT | — | Get own feedback |
| GET | `/api/admin/users` | JWT | admin | List all users |
| GET | `/api/admin/feedback` | JWT | admin | List all feedback |
