import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TagTrellis',
  description: 'Build a private tag graph and attach things.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5180')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header>
            <div>
              <h1 style={{ margin: 0 }}>TagTrellis</h1>
              <p className="muted" style={{ margin: 0 }}>Private tag graph with linked “things”.</p>
            </div>
            <nav>
              <a href="/">Tags</a>
              <a href="/things">Things</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
