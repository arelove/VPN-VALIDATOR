import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventsTable from '@/components/EventsTable';

const mockEvents = [
  {
    id: 1,
    username: 'user4',
    event_type: 'LOGIN' as const,
    level: 'INFO' as const,
    ip_address: '192.168.1.50',
    message: 'User user4 logged in from 192.168.1.50',
    timestamp: '2026-01-12T05:50:10Z',
  },
  {
    id: 2,
    username: 'system',
    event_type: 'ERROR' as const,
    level: 'ERROR' as const,
    ip_address: null,
    message: 'Database connection failed',
    timestamp: '2026-01-12T07:30:00Z',
  },
];

describe('EventsTable', () => {
  it('отображает все события', () => {
    render(<EventsTable events={mockEvents} />);
    expect(screen.getByText('User user4 logged in from 192.168.1.50')).toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('фильтрует по уровню ERROR', () => {
    render(<EventsTable events={mockEvents} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'ERROR' } });
    expect(screen.queryByText('User user4 logged in from 192.168.1.50')).not.toBeInTheDocument();
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('фильтрует по тексту сообщения', () => {
    render(<EventsTable events={mockEvents} />);
    const input = screen.getByPlaceholderText('Поиск по сообщению или пользователю…');
    fireEvent.change(input, { target: { value: 'database' } });
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    expect(screen.queryByText('User user4 logged in from 192.168.1.50')).not.toBeInTheDocument();
  });

  it('показывает badge с уровнем', () => {
    render(<EventsTable events={mockEvents} />);
    const infoBadges = screen.getAllByText('INFO');
    expect(infoBadges.length).toBeGreaterThan(0);
    const errorBadges = screen.getAllByText('ERROR');
    expect(errorBadges.length).toBeGreaterThan(0);
    });

  it('показывает "Ничего не найдено" при пустом результате', () => {
    render(<EventsTable events={mockEvents} />);
    const input = screen.getByPlaceholderText('Поиск по сообщению или пользователю…');
    fireEvent.change(input, { target: { value: 'xyzxyzxyz' } });
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });
});