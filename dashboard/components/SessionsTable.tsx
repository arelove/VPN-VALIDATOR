'use client';

import { useState, useMemo } from 'react';
import type { Session } from '@/lib/api';

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDuration(sec: number | null): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

function initials(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .toUpperCase();
}

type SortKey = 'login_at' | 'duration_sec' | 'username';

export default function SessionsTable({ sessions }: { sessions: Session[] }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('login_at');

  const maxDur = useMemo(
    () => Math.max(...sessions.map((s) => s.duration_sec ?? 0), 1),
    [sessions]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return [...sessions]
      .filter((s) => !q || s.username.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === 'duration_sec') return (b.duration_sec ?? 0) - (a.duration_sec ?? 0);
        if (sortBy === 'username') return a.username.localeCompare(b.username);
        return new Date(a.login_at).getTime() - new Date(b.login_at).getTime();
      });
  }, [sessions, query, sortBy]);

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.6rem 1rem',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '0.5px solid var(--border)',
    background: 'var(--bg)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.65rem 1rem',
    borderBottom: '0.5px solid var(--border)',
    verticalAlign: 'middle',
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.875rem 1rem',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="search"
            placeholder="Поиск пользователя…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: 'var(--bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 10px',
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
              width: 200,
            }}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{
              background: 'var(--bg)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 10px',
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none',
            }}
          >
            <option value="login_at">По времени входа</option>
            <option value="duration_sec">По длительности</option>
            <option value="username">По имени</option>
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} записей</span>
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Пользователь</th>
              <th style={thStyle}>IP-адрес</th>
              <th style={thStyle}>Вход</th>
              <th style={thStyle}>Выход</th>
              <th style={thStyle}>Длительность</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    ...tdStyle,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    padding: '2rem',
                  }}
                >
                  Ничего не найдено
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const barW = Math.round(((s.duration_sec ?? 0) / maxDur) * 100);
                return (
                  <tr
                    key={s.id}
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--accent-bg)',
                            color: 'var(--accent-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 500,
                            flexShrink: 0,
                          }}
                        >
                          {initials(s.username)}
                        </div>
                        {s.username}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>
                      {s.ip_address ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{fmtTime(s.login_at)}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      {s.logout_at ? fmtTime(s.logout_at) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 80,
                            height: 4,
                            borderRadius: 2,
                            background: 'var(--border-md)',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              width: `${barW}%`,
                              height: '100%',
                              borderRadius: 2,
                              background: 'var(--accent)',
                            }}
                          />
                        </div>
                        {fmtDuration(s.duration_sec)}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
