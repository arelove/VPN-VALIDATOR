'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h2 style={{ fontWeight: 500, marginBottom: 8 }}>Ошибка загрузки данных</h2>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{error.message}</p>
      <button onClick={reset} style={{ color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none' }}>
        Попробовать снова
      </button>
    </div>
  );
}