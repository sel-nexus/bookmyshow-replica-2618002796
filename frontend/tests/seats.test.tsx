import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PresetSeatAction } from '../components/PresetSeatAction';
import { BookingJourneyProvider } from '../state/BookingJourneyProvider';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push })
}));

afterEach(() => {
  push.mockReset();
  vi.unstubAllGlobals();
});

/** Render the local seat action within the same journey provider used by the app. */
function renderSeatAction(): void {
  render(
    <BookingJourneyProvider>
      <PresetSeatAction />
    </BookingJourneyProvider>
  );
}

describe('preset seat action', () => {
  it('keeps the journey empty before the explicit Select Seats action', () => {
    renderSeatAction();

    expect(screen.getByRole('status')).toHaveTextContent('No seats selected.');
    expect(screen.queryByText(/A1, A2, A3/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rs\. 450/)).not.toBeInTheDocument();
  });

  it('sets exactly the fixed preset locally and continues to checkout without fetching', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderSeatAction();

    await user.click(screen.getByRole('button', { name: 'Select Seats' }));

    expect(screen.getByRole('status')).toHaveTextContent('Selected seats: A1, A2, A3. Total: Rs. 450');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/checkout');
  });

  it('replaces the selection with the same exact preset when clicked repeatedly', async () => {
    const user = userEvent.setup();
    renderSeatAction();

    await user.click(screen.getByRole('button', { name: 'Select Seats' }));
    await user.click(screen.getByRole('button', { name: 'Select Seats' }));

    expect(screen.getByRole('status')).toHaveTextContent('Selected seats: A1, A2, A3. Total: Rs. 450');
    expect(screen.getByRole('status')).not.toHaveTextContent('A4');
    expect(push).toHaveBeenCalledTimes(2);
  });
});
