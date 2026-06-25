/** Shared TypeScript types — no `any` anywhere */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ProfileResponse {
  user: User;
}

export interface Feedback {
  id: number;
  user_id: number;
  title: string;
  message: string;
  category: 'bug' | 'feature' | 'general';
  created_at: string;
  user_name: string;
  user_email: string;
}

export interface FeedbackResponse {
  feedback: Feedback[];
}

export interface FeedbackCreateResponse {
  message: string;
  feedback: Feedback;
}

export interface StockQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export interface StockCandles {
  c: number[]; // close prices
  h: number[]; // high prices
  l: number[]; // low prices
  o: number[]; // open prices
  s: string;   // status
  t: number[]; // timestamps
  v: number[]; // volumes
}

export interface UsersResponse {
  users: User[];
}
