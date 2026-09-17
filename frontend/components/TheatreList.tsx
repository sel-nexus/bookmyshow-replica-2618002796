'use client';

import React from 'react';
import type { CatalogTheatre } from '../lib/api';

/** Displays theatres mapped to the deliberately selected movie. */
export function TheatreList({ theatres, onSelect }: { theatres: CatalogTheatre[]; onSelect: (theatre: CatalogTheatre) => void }) {
  return <ul aria-label="Mapped theatres">{theatres.map((theatre) => <li key={theatre.id}><button type="button" onClick={() => onSelect(theatre)}>Select {theatre.name}</button></li>)}</ul>;
}
