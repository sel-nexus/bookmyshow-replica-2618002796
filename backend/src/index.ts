import { createApp } from './app';
import { config } from './config';

/** Starts the HTTP server on the configured public interface and port. */
function start(): void {
  createApp().listen(config.port, '0.0.0.0', () => {
    console.log(`Auth foundation backend listening on port ${config.port}`);
  });
}

start();
