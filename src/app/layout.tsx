import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Receipt Vault',
  description: 'Securely store and tag receipts.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5177')
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="card" style={{ margin: '24px auto 0', maxWidth: '1100px' }}>
          <div className="toolbar">
            <strong>Receipt Vault</strong>
            <a className="btn secondary" href="/">Upload</a>
            <a className="btn secondary" href="/vault">Vault</a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
