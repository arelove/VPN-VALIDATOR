import { api } from '@/lib/api';
import StatCards from '@/components/StatCards';
import SessionsTable from '@/components/SessionsTable';

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function DashboardPage() {
  const [stats, sessions, events] = await Promise.all([
    api.stats(),
    api.sessions(),
    api.events(),
  ]);

  const alerts = events.filter((e) => e.level === 'ERROR' || e.level === 'WARN');

  return (
    <>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Дашборд</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Сводка по сессиям и активности за весь период
        </p>
      </div>

      <StatCards stats={stats} />

      {alerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>
            Требует внимания — {alerts.length} событий
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alerts.map((e) => (
              <div
                key={e.id}
                style={{
                  padding: '0.25rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: e.level === 'ERROR' ? 'var(--error-bg)' : 'var(--warn-bg)',
                  color: e.level === 'ERROR' ? 'var(--error-text)' : 'var(--warn-text)',
                  fontSize: 13,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span>{e.message}</span>
                <span style={{ opacity: 0.7, whiteSpace: 'nowrap', fontSize: 12 }}>
                  {e.username !== 'system' ? `${e.username} · ` : ''}
                  {fmtTime(e.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 500 }}>Сессии</h2>
      </div>
      <SessionsTable sessions={sessions} />
    </>
  );
}