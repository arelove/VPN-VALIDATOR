import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'VPN Monitor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <header
          style={{
            background: 'var(--surface)',
            borderBottom: '0.5px solid var(--border)',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            height: '52px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#63c940',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 500, fontSize: 15 }}>VPN Monitor</span>
          </div>

          <Nav />

        </header>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>{children}</main>
      </body>
    </html>
  );
}
