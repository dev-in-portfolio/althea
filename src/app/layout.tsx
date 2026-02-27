import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Room Key',
  description: 'Shared rooms with invite codes and collaborative items.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5178')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header>
            <div>
              <h1 style={{ margin: 0 }}>Room Key</h1>
              <p className="muted" style={{ margin: 0 }}>Shared spaces for teams and households.</p>
            </div>
            <nav>
              <a href="/">Rooms</a>
              <a href="/join">Join</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
