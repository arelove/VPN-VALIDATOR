const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface Stats {
  totalUsers: number;
  totalEvents: number;
  totalErrors: number;
  avgSessionSec: number;
}

export interface Session {
  id: number;
  username: string;
  ip_address: string | null;
  login_at: string;
  logout_at: string | null;
  duration_sec: number | null;
}

export interface VpnEvent {
  id: number;
  username: string;
  event_type: 'LOGIN' | 'LOGOUT' | 'WARN' | 'ERROR';
  level: 'INFO' | 'WARN' | 'ERROR';
  ip_address: string | null;
  message: string;
  timestamp: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error: ${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  stats: ()    => apiFetch<Stats>('/api/stats'),
  sessions: () => apiFetch<Session[]>('/api/sessions'),
  events: ()   => apiFetch<VpnEvent[]>('/api/events'),
};
