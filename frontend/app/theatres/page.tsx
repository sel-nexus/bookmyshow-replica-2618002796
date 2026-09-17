'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TheatreList } from '../../components/TheatreList';
import { fetchTheatres, type CatalogTheatre } from '../../lib/api';
import { useBookingJourney } from '../../state/BookingJourneyProvider';

/** Fetches theatres only after a movie has been deliberately selected. */
export default function TheatresPage() {
  const router = useRouter();
  const { selectedMovie, selectTheatre } = useBookingJourney();
  const [theatres, setTheatres] = useState<CatalogTheatre[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (!selectedMovie) return; void fetchTheatres(selectedMovie.id).then(setTheatres).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load theatres.')); }, [selectedMovie]);
  if (!selectedMovie) return <main className="auth-shell"><section className="auth-panel"><h1>Choose a movie first.</h1><button type="button" onClick={() => router.push('/movies')}>Browse movies</button></section></main>;
  function handleSelection(theatre: CatalogTheatre): void {
    selectTheatre(theatre);
    router.push('/seats');
  }
  return <main className="auth-shell"><header className="site-header"><p className="wordmark">SIGNAL<span>RED</span></p></header><section className="auth-panel" aria-labelledby="theatres-title"><p className="eyebrow">STEP 02 · {selectedMovie.title}</p><h1 id="theatres-title">Choose a theatre.</h1><p className="auth-intro">Only theatres mapped to your movie are shown.</p>{error ? <p className="form-error" role="alert">{error}</p> : theatres.length ? <TheatreList theatres={theatres} onSelect={handleSelection} /> : <p role="status">Loading theatres…</p>}</section></main>;
}
