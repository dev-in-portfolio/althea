import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import { RouterHead } from './routes/head';
import './global.css';

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
      </head>
      <body lang="en">
        <div class="app-shell">
          <header class="app-header">
            <div class="brand">
              <h1>Qwik SignalTile</h1>
              <span>Live signal board with rule-aware status, built for portfolio demos.</span>
            </div>
            <nav class="nav-links">
              <a href="/">Board</a>
              <a href="/manage">Manage</a>
              <a href="https://neon.tech" target="_blank" rel="noreferrer">
                Data
              </a>
            </nav>
          </header>
          <main class="app-main">
            <RouterOutlet />
          </main>
          <footer class="footer">
            <span>Qwik SignalTile · Rule-aware status feeds</span>
            <span class="pill">Device-scoped | Neon-backed</span>
          </footer>
        </div>
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
