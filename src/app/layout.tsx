import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5176'),
  title: 'Pocket Pass',
  description: 'Personal membership pass with check-ins.',
  openGraph: {
    title: 'Pocket Pass',
    description: 'Personal membership pass with check-ins.',
    images: ['/og.svg']
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.svg']
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="card" style={{ margin: '24px auto 0', maxWidth: '1100px' }}>
          <div className="toolbar">
            <strong>Pocket Pass</strong>
            <a className="btn secondary" href="/">Pass</a>
            <a className="btn secondary" href="/history">History</a>
            <a className="btn secondary" href="/admin/locations">Locations</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
