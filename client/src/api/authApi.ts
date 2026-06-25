import type { AuthResponse, ProfileResponse } from '../types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data as T;
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse<AuthResponse>(res);
}

export async function checkAuthApi(): Promise<ProfileResponse> {
  const res = await fetch(`${BASE}/auth/check`, {
    credentials: 'include',
  });
  return handleResponse<ProfileResponse>(res);
}

export async function logoutApi(): Promise<void> {
  await fetch(`${BASE}/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
