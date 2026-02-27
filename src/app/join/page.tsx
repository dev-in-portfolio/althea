import { Suspense } from 'react';
import JoinClient from './JoinClient';

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="card"><p className="muted">Loading join…</p></div>}>
      <JoinClient />
    </Suspense>
  );
}
