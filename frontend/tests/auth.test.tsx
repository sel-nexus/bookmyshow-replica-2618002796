import React from 'react';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '../components/LoginForm';

const fetchMock = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  push.mockReset();
});

afterEach(() => cleanup());

describe('LoginForm', () => {
  it('requests OTP only after the user submits a mobile number', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Mobile number'), {
      target: { value: '9876543210' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mobileNumber: '9876543210' })
        }),
      );
    });
    expect(screen.getByLabelText('Verification code')).toBeInTheDocument();
  });

  it('shows a backend verification error for an incorrect OTP', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'The verification code is incorrect.' } })
      });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Mobile number'), {
      target: { value: '9876543210' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Verification code');
    fireEvent.change(screen.getByLabelText('Verification code'), {
      target: { value: '0000' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify access' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'verification code is incorrect',
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('routes to movies after a successful OTP response without storing its token', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'AUTHENTICATED',
          sessionToken: 'server-only-token',
          user: {
            id: 'user-1',
            mobileNumber: '9876543210',
            createdAt: '2026-01-01T00:00:00.000Z'
          }
        })
      });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText('Mobile number'), {
      target: { value: '9876543210' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Verification code');
    fireEvent.change(screen.getByLabelText('Verification code'), {
      target: { value: '1234' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify access' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/movies'));
    expect(window.localStorage.getItem('sessionToken')).toBeNull();
  });
});
