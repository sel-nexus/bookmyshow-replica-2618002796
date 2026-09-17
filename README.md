# Booking confirmation

## Run locally

Install dependencies in each tier, then start the backend and frontend in separate terminals:

```sh
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Set backend environment values before starting: `PORT=3001`, `DATABASE_PATH=./bookings.sqlite`, `SESSION_SECRET=development-session-secret-change-me`, `SESSION_COOKIE_NAME=bms_session`, `CORS_ORIGIN=http://localhost:3000`, and `COOKIE_SECURE=false`. The frontend uses the same origin by default, or set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` for direct development access.

Sign in with the existing OTP flow, select a catalogue movie/theatre and the fixed seat set, then pay at `/checkout`. The app sends no card or UPI values to the API; it sends only the selected payment method and a UUID idempotency key.

## Docker Compose

```sh
docker compose up --build
```

This launches only frontend and backend services. The named `sqlite-data` volume is shared with the backend at `/data` and persists bookings; no database container is required.

## Verification

```sh
cd backend && npm test && npm run build
cd frontend && npm test && npm run build
```
