import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LatchList',
  description: 'Process latch checklist with enforced proof requirements.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5179')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header>
            <div>
              <h1 style={{ margin: 0 }}>LatchList</h1>
              <p className="muted" style={{ margin: 0 }}>Proof-first checklists with enforceable phases.</p>
            </div>
            <nav>
              <a href="/">Latches</a>
              <a href="/login">Login</a>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
