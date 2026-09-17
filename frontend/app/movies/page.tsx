'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovieCatalogue } from '../../components/MovieCatalogue';
import { fetchMovies, type CatalogMovie } from '../../lib/api';
import { useBookingJourney } from '../../state/BookingJourneyProvider';

/** Fetches and renders the available catalogue movies for deliberate selection. */
export default function MoviesPage() {
  const router = useRouter();
  const { selectMovie } = useBookingJourney();
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { void fetchMovies().then(setMovies).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load movies.')); }, []);
  function handleSelection(movie: CatalogMovie): void { selectMovie(movie); router.push('/theatres'); }
  return <main className="auth-shell"><header className="site-header"><p className="wordmark">SIGNAL<span>RED</span></p></header><section className="auth-panel" aria-labelledby="movies-title"><p className="eyebrow">STEP 01</p><h1 id="movies-title">Choose a movie.</h1><p className="auth-intro">Select a title to see its available theatres.</p>{error ? <p className="form-error" role="alert">{error}</p> : movies.length ? <MovieCatalogue movies={movies} onSelect={handleSelection} /> : <p role="status">Loading movies…</p>}</section></main>;
}
