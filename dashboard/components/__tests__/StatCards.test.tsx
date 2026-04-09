import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatCards from '@/components/StatCards';

const mockStats = {
  totalUsers: 6,
  totalEvents: 17,
  totalErrors: 4,
  avgSessionSec: 5822,
};

describe('StatCards', () => {
  it('отображает количество пользователей', () => {
    render(<StatCards stats={mockStats} />);
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('отображает количество событий', () => {
    render(<StatCards stats={mockStats} />);
    expect(screen.getByText('17')).toBeInTheDocument();
  });

  it('отображает количество ошибок', () => {
    render(<StatCards stats={mockStats} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('форматирует среднюю сессию в часы и минуты', () => {
    render(<StatCards stats={mockStats} />);
    expect(screen.getByText('1ч 37м')).toBeInTheDocument();
  });
});