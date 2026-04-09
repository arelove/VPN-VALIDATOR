import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>404</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Страница не найдена</p>
      <Link href="/" style={{ color: 'var(--accent)' }}>← На главную</Link>
    </div>
  );
}