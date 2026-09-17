'use client';

import React, { createContext, type ReactNode, useContext, useReducer } from 'react';
import type { CatalogMovie, CatalogTheatre } from '../lib/api';

interface BookingJourneyState { selectedMovie: CatalogMovie | null; selectedTheatre: CatalogTheatre | null; }
type BookingJourneyAction = { type: 'SELECT_MOVIE'; movie: CatalogMovie } | { type: 'SELECT_THEATRE'; theatre: CatalogTheatre };
interface BookingJourneyContextValue extends BookingJourneyState { selectMovie: (movie: CatalogMovie) => void; selectTheatre: (theatre: CatalogTheatre) => void; }

const BookingJourneyContext = createContext<BookingJourneyContextValue | null>(null);

/** Applies only explicit movie and theatre choices to the booking journey. */
function bookingJourneyReducer(state: BookingJourneyState, action: BookingJourneyAction): BookingJourneyState {
  if (action.type === 'SELECT_MOVIE') return { selectedMovie: action.movie, selectedTheatre: null };
  return { ...state, selectedTheatre: action.theatre };
}

/** Stores deliberate booking choices for client-side journey pages. */
export function BookingJourneyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingJourneyReducer, { selectedMovie: null, selectedTheatre: null });
  return <BookingJourneyContext.Provider value={{ ...state, selectMovie: (movie) => dispatch({ type: 'SELECT_MOVIE', movie }), selectTheatre: (theatre) => dispatch({ type: 'SELECT_THEATRE', theatre }) }}>{children}</BookingJourneyContext.Provider>;
}

/** Reads the current booking journey or reports an invalid provider-free use. */
export function useBookingJourney(): BookingJourneyContextValue {
  const context = useContext(BookingJourneyContext);
  if (!context) throw new Error('BookingJourneyProvider is required.');
  return context;
}
