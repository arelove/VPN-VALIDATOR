'use client';

import { useState, useMemo } from 'react';
import type { VpnEvent } from '@/lib/api';

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const BADGE: Record<string, { bg: string; text: string }> = {
  INFO: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
  WARN: { bg: 'var(--warn-bg)', text: 'var(--warn-text)' },
  ERROR: { bg: 'var(--error-bg)', text: 'var(--error-text)' },
};

export default function EventsTable({ events }: { events: VpnEvent[] }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return events.filter((e) => {
      if (level && e.level !== level) return false;
      if (
        q &&
        !e.message.toLowerCase().includes(q) &&
        !(e.username ?? '').toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [events, query, level]);

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

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '0.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '5px 10px',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
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
            placeholder="Поиск по сообщению или пользователю…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ ...inputStyle, width: 260 }}
          />
          <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
            <option value="">Все уровни</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{filtered.length} записей</span>
      </div>

      <div style={{ maxHeight: 520, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thStyle}>Время</th>
              <th style={thStyle}>Уровень</th>
              <th style={thStyle}>Пользователь</th>
              <th style={{ ...thStyle, width: '99%' }}>Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
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
              filtered.map((e) => {
                const badge = BADGE[e.level] ?? BADGE.INFO;
                return (
                  <tr
                    key={e.id}
                    onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtTime(e.timestamp)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: badge.bg,
                          color: badge.text,
                        }}
                      >
                        {e.level}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        whiteSpace: 'nowrap',
                        color: e.username === 'system' ? 'var(--muted)' : 'var(--text)',
                      }}
                    >
                      {e.username}
                    </td>
                    <td style={tdStyle}>{e.message}</td>
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
