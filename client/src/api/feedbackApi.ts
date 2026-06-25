import type { FeedbackResponse, FeedbackCreateResponse } from '../types';

const BASE = '/api';

export async function fetchUserFeedback(): Promise<FeedbackResponse> {
  const res = await fetch(`${BASE}/feedback`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch feedback');
  }
  return res.json();
}

export async function createFeedback(
  title: string,
  message: string,
  category: string
): Promise<FeedbackCreateResponse> {
  const res = await fetch(`${BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, message, category }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit feedback');
  }
  return res.json();
}

export async function fetchAllFeedback(): Promise<FeedbackResponse> {
  const res = await fetch(`${BASE}/admin/feedback`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch all feedback');
  }
  return res.json();
}
