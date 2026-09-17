/** Represents a moviegoer returned by the authentication API. */
export interface AuthUser { id: string; mobileNumber: string; createdAt: string; }

/** Represents the public error envelope returned by the backend. */
interface ApiErrorEnvelope { error: { code: string; message: string; requestId: string }; }

/** Represents a successful OTP verification response. */
export interface VerifyResponse { status: 'AUTHENTICATED'; sessionToken: string; user: AuthUser; }

/** Represents a backend-sourced confirmed booking. */
export interface BookingConfirmation { confirmationId: string; movie: CatalogMovie; theatre: CatalogTheatre; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPricePaise: number; createdAt: string; }

/** Represents the payment-data-free booking contract sent to the backend. */
export interface CreateBookingRequest { movieId: string; theatreId: string; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPricePaise: number; }

/** Represents a movie available for deliberate selection. */
export interface CatalogMovie { id: string; title: string; }

/** Represents a theatre mapped to a selected movie. */
export interface CatalogTheatre { id: string; name: string; }

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/** Calls the login endpoint after an explicit user action. */
export async function requestLogin(mobileNumber: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobileNumber }) });
  if (!response.ok) throw await readApiError(response);
}

/** Verifies an OTP without storing the returned token in the browser. */
export async function verifyOtp(mobileNumber: string, otp: string): Promise<VerifyResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/verify`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobileNumber, otp }) });
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<VerifyResponse>;
}

/** Fetches every movie exposed by the public catalogue API. */
export async function fetchMovies(): Promise<CatalogMovie[]> {
  const response = await fetch(`${apiBaseUrl}/api/movies`, { credentials: 'include' });
  if (!response.ok) throw await readApiError(response);
  return (await response.json() as { movies: CatalogMovie[] }).movies;
}

/** Fetches only theatres mapped to one selected movie. */
export async function fetchTheatres(movieId: string): Promise<CatalogTheatre[]> {
  const response = await fetch(`${apiBaseUrl}/api/theatres?movieId=${encodeURIComponent(movieId)}`, { credentials: 'include' });
  if (!response.ok) throw await readApiError(response);
  return (await response.json() as { theatres: CatalogTheatre[] }).theatres;
}

/** Confirms a booking while deliberately excluding raw card and UPI values. */
export async function createBooking(request: CreateBookingRequest, idempotencyKey: string): Promise<BookingConfirmation> {
  const response = await fetch(`${apiBaseUrl}/api/bookings`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(request) });
  if (!response.ok) throw await readApiError(response);
  return (await response.json() as { booking: BookingConfirmation }).booking;
}

/** Extracts a human-readable failure from the public API error envelope. */
async function readApiError(response: Response): Promise<Error> {
  const payload = await response.json().catch(() => null) as ApiErrorEnvelope | null;
  return new Error(payload?.error.message ?? 'Unable to complete this request.');
}
