import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmationCard } from '../components/ConfirmationCard';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
describe('ConfirmationCard', () => {
  it('renders server confirmation data rather than a local selection', () => {
    render(<ConfirmationCard booking={{ confirmationId: 'server-confirmation', movie: { id: 'movie-paradise', title: 'Paradise from server' }, theatre: { id: 'theatre-sandhya-70mm', name: 'Sandhya from server' }, seats: ['A1', 'A2', 'A3'], paymentMethod: 'UPI', totalPricePaise: 45000, createdAt: '2026-01-01T00:00:00.000Z' }} />);
    expect(screen.getByRole('heading', { name: 'Congratulations!' })).toBeInTheDocument(); expect(screen.getByText('server-confirmation')).toBeInTheDocument(); expect(screen.getByText('Paradise from server')).toBeInTheDocument(); expect(screen.getByText('Sandhya from server')).toBeInTheDocument();
  });
});
