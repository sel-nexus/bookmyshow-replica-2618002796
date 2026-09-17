'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MovieCatalogue } from '../../components/MovieCatalogue';
import { fetchMovies, type CatalogMovie } from '../../lib/api';
import { useBookingJourney } from '../../state/BookingJourneyProvider';

/** Fetches and renders the available catalogue movies for deliberate selection. */
export default function MoviesPage(): React.JSX.Element {
  const router = useRouter();
  const { selectMovie } = useBookingJourney();
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchMovies()
      .then(setMovies)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to load movies.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  function handleSelection(movie: CatalogMovie): void {
    selectMovie(movie);
    router.push('/theatres');
  }

  return (
    <main className="auth-shell">
      <header className="site-header">
        <p className="wordmark">
          SIGNAL<span>RED</span>
        </p>
      </header>
      <section className="auth-panel" aria-labelledby="movies-title">
        <p className="eyebrow">STEP 01</p>
        <h1 id="movies-title">Choose a movie.</h1>
        <p className="auth-intro">Select a title to see its available theatres.</p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : isLoading ? (
          <p role="status">Loading movies…</p>
        ) : movies.length ? (
          <MovieCatalogue movies={movies} onSelect={handleSelection} />
        ) : (
          <p role="status">No movies are available right now.</p>
        )}
      </section>
    </main>
  );
}
