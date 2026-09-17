'use client';

import React, { createContext, type ReactNode, useContext, useReducer } from 'react';
import type { CatalogMovie, CatalogTheatre } from '../lib/api';

interface BookingJourneyState {
  selectedMovie: CatalogMovie | null;
  selectedTheatre: CatalogTheatre | null;
  selectedSeats: string[] | null;
  totalPricePaise: number | null;
  paymentMethod: 'CARD' | 'UPI' | null;
  bookingConfirmation: import('../lib/api').BookingConfirmation | null;
}
type BookingJourneyAction =
  | { type: 'SELECT_MOVIE'; movie: CatalogMovie }
  | { type: 'SELECT_THEATRE'; theatre: CatalogTheatre }
  | { type: 'SELECT_PRESET_SEATS' }
  | { type: 'SELECT_PAYMENT_METHOD'; paymentMethod: 'CARD' | 'UPI' }
  | { type: 'SAVE_CONFIRMATION'; bookingConfirmation: import('../lib/api').BookingConfirmation };
interface BookingJourneyContextValue extends BookingJourneyState {
  selectMovie: (movie: CatalogMovie) => void;
  selectTheatre: (theatre: CatalogTheatre) => void;
  selectPresetSeats: () => void;
  selectPaymentMethod: (paymentMethod: 'CARD' | 'UPI') => void;
  saveConfirmation: (bookingConfirmation: import('../lib/api').BookingConfirmation) => void;
}

const presetSeats = ['A1', 'A2', 'A3'];
const presetTotalPricePaise = 45000;

const BookingJourneyContext = createContext<BookingJourneyContextValue | null>(null);

/** Apply explicit journey choices and replace the seat preset deterministically. */
function bookingJourneyReducer(state: BookingJourneyState, action: BookingJourneyAction): BookingJourneyState {
  if (action.type === 'SELECT_MOVIE') {
    return {
      ...state,
      selectedMovie: action.movie,
      selectedTheatre: null,
      selectedSeats: null,
      totalPricePaise: null,
      paymentMethod: null,
      bookingConfirmation: null
    };
  }
  if (action.type === 'SELECT_THEATRE') {
    return {
      ...state,
      selectedTheatre: action.theatre,
      selectedSeats: null,
      totalPricePaise: null
    };
  }
  if (action.type === 'SELECT_PRESET_SEATS') return { ...state, selectedSeats: [...presetSeats], totalPricePaise: presetTotalPricePaise };
  if (action.type === 'SELECT_PAYMENT_METHOD') return { ...state, paymentMethod: action.paymentMethod };
  return { ...state, bookingConfirmation: action.bookingConfirmation };
}

/** Store deliberate booking choices for client-side journey pages. */
export function BookingJourneyProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [state, dispatch] = useReducer(bookingJourneyReducer, {
    selectedMovie: null,
    selectedTheatre: null,
    selectedSeats: null,
    totalPricePaise: null,
    paymentMethod: null,
    bookingConfirmation: null
  });

  return (
    <BookingJourneyContext.Provider
      value={{
        ...state,
        selectMovie: (movie) => dispatch({ type: 'SELECT_MOVIE', movie }),
        selectTheatre: (theatre) => dispatch({ type: 'SELECT_THEATRE', theatre }),
        selectPresetSeats: () => dispatch({ type: 'SELECT_PRESET_SEATS' }),
        selectPaymentMethod: (paymentMethod) => dispatch({ type: 'SELECT_PAYMENT_METHOD', paymentMethod }),
        saveConfirmation: (bookingConfirmation) => dispatch({ type: 'SAVE_CONFIRMATION', bookingConfirmation })
      }}
    >
      {children}
    </BookingJourneyContext.Provider>
  );
}

/** Reads the current booking journey or reports an invalid provider-free use. */
export function useBookingJourney(): BookingJourneyContextValue {
  const context = useContext(BookingJourneyContext);
  if (!context) throw new Error('BookingJourneyProvider is required.');
  return context;
}
