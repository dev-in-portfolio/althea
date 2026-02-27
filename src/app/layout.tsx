import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SessionMint',
  description: 'Session logging with weekly mint rollups.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5182')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header>
            <div>
              <h1 style={{ margin: 0 }}>SessionMint</h1>
              <p className="muted" style={{ margin: 0 }}>Structured sessions, weekly mint rollups.</p>
            </div>
            <nav>
              <a href="/">Session</a>
              <a href="/history">History</a>
              <a href="/mints">Mints</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
