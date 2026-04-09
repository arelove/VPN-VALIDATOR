'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Дашборд' },
  { href: '/events', label: 'События' },
  { href: '/chart', label: 'Аналитика' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav style={{ display: 'flex', gap: '0.25rem' }}>
      {navLinks.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              color: active ? 'var(--text)' : 'var(--muted)',
              background: active ? 'var(--bg)' : 'transparent',
              fontWeight: active ? 500 : 400,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
