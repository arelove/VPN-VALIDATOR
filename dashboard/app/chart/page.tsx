import { api } from '@/lib/api';
import UserBarChart from '@/components/UserBarChart';

export default async function ChartPage() {
  const sessions = await api.sessions();

  const userCount = new Set(sessions.map((s) => s.username)).size;
  const totalMin = Math.round(sessions.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0) / 60);

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Аналитика</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {userCount} пользователей &mdash; суммарно {totalMin} мин активности
        </p>
      </div>
      <UserBarChart sessions={sessions} />
    </>
  );
}
