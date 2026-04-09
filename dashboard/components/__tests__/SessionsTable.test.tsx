import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SessionsTable from '@/components/SessionsTable';

const mockSessions = [
  {
    id: 1,
    username: 'user4',
    ip_address: '192.168.1.50',
    login_at: '2026-01-12T05:50:10Z',
    logout_at: '2026-01-12T06:10:22Z',
    duration_sec: 1212,
  },
  {
    id: 2,
    username: 'user10',
    ip_address: '192.168.1.100',
    login_at: '2026-01-12T10:20:20Z',
    logout_at: '2026-01-12T11:05:40Z',
    duration_sec: 2720,
  },
];

describe('SessionsTable', () => {
  it('отображает всех пользователей', () => {
    render(<SessionsTable sessions={mockSessions} />);
    expect(screen.getByText('user4')).toBeInTheDocument();
    expect(screen.getByText('user10')).toBeInTheDocument();
  });

  it('показывает количество записей', () => {
    render(<SessionsTable sessions={mockSessions} />);
    expect(screen.getByText('2 записей')).toBeInTheDocument();
  });

  it('фильтрует по имени пользователя', () => {
    render(<SessionsTable sessions={mockSessions} />);
    const input = screen.getByPlaceholderText('Поиск пользователя…');
    fireEvent.change(input, { target: { value: 'user4' } });
    expect(screen.getByText('user4')).toBeInTheDocument();
    expect(screen.queryByText('user10')).not.toBeInTheDocument();
    expect(screen.getByText('1 записей')).toBeInTheDocument();
  });

  it('показывает прочерк если нет logout', () => {
    const sessions = [{ ...mockSessions[0], logout_at: null, duration_sec: null }];
    render(<SessionsTable sessions={sessions} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('форматирует длительность в минуты и секунды', () => {
    render(<SessionsTable sessions={mockSessions} />);
    expect(screen.getByText('20м 12с')).toBeInTheDocument();
  });
});