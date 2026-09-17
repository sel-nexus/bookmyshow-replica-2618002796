'use client';

import React from 'react';
import type { CatalogMovie } from '../lib/api';

/** Displays API-backed movie choices with simple visual placeholders. */
export function MovieCatalogue({ movies, onSelect }: { movies: CatalogMovie[]; onSelect: (movie: CatalogMovie) => void }) {
  return <ul aria-label="Movies">{movies.map((movie) => <li key={movie.id}><button type="button" onClick={() => onSelect(movie)} aria-label={`Select ${movie.title}`}><span aria-hidden="true">▰</span><span>{movie.title}</span></button></li>)}</ul>;
}
