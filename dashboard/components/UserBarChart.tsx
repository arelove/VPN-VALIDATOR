'use client';

import { useState, useMemo } from 'react';
import type { Session } from '@/lib/api';

type Metric = 'total' | 'count' | 'avg';

const METRIC_LABELS: Record<Metric, string> = {
  total: 'Суммарное время (мин)',
  count: 'Число сессий',
  avg:   'Среднее время (мин)',
};

export default function UserBarChart({ sessions }: { sessions: Session[] }) {
  const [metric, setMetric] = useState<Metric>('total');

  const rows = useMemo(() => {
    const byUser: Record<string, { total: number; count: number }> = {};
    sessions.forEach(s => {
      if (!byUser[s.username]) byUser[s.username] = { total: 0, count: 0 };
      byUser[s.username].total += s.duration_sec ?? 0;
      byUser[s.username].count += 1;
    });

    return Object.entries(byUser)
      .map(([name, d]) => ({
        name,
        total: Math.round(d.total / 60),
        count: d.count,
        avg:   d.count ? Math.round(d.total / d.count / 60) : 0,
      }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 15);
  }, [sessions, metric]);

  const maxVal = Math.max(...rows.map(r => r[metric]), 1);

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '5px 10px',
    fontSize: 13, color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>Топ пользователей</span>
        <select value={metric} onChange={e => setMetric(e.target.value as Metric)} style={inputStyle}>
          {(Object.keys(METRIC_LABELS) as Metric[]).map(m => (
            <option key={m} value={m}>{METRIC_LABELS[m]}</option>
          ))}
        </select>
      </div>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(r => {
          const val = r[metric];
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 80, fontSize: 12, color: 'var(--muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name}
              </div>
              <div style={{ flex: 1, height: 16, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ width: 70, fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                {val} {metric === 'count' ? 'сесс.' : 'мин'}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>Нет данных</div>
        )}
      </div>
    </div>
  );
}
