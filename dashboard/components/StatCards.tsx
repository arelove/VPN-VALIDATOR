import type { Stats } from '@/lib/api';

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m} мин`;
}

interface CardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'error' | 'info';
}

function Card({ label, value, sub, accent }: CardProps) {
  const colors = {
    error: { bg: 'var(--error-bg)', text: 'var(--error-text)' },
    info: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
  };
  const style = accent ? { background: colors[accent].bg } : {};
  const valueColor = accent ? colors[accent].text : 'var(--text)';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.25rem',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color: valueColor }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function StatCards({ stats }: { stats: Stats }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
        marginBottom: '1.5rem',
      }}
    >
      <Card label="Пользователи" value={stats.totalUsers} />
      <Card label="Событий" value={stats.totalEvents} />
      <Card label="Ошибок" value={stats.totalErrors} accent="error" />
      <Card
        label="Средняя сессия"
        value={fmtDuration(stats.avgSessionSec)}
        sub={`${Math.round(stats.avgSessionSec)} сек`}
      />
    </div>
  );
}
