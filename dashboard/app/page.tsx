import { api } from '@/lib/api';
import StatCards from '@/components/StatCards';
import SessionsTable from '@/components/SessionsTable';

export default async function DashboardPage() {
  const [stats, sessions] = await Promise.all([api.stats(), api.sessions()]);

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Дашборд</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Сводка по сессиям и активности за весь период
        </p>
      </div>

      <StatCards stats={stats} />

      <div style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 500 }}>Сессии</h2>
      </div>
      <SessionsTable sessions={sessions} />
    </>
  );
}
