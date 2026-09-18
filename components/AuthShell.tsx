import type { ReactNode } from 'react';

/** Navy-field frame for login / unauthorized: wordmark, centred card, privacy line. */
export function AuthShell({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh navy-field flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="wordmark text-xl sm:text-2xl mb-1">Silicon Valley Judo</p>
          <p className="eyebrow text-white/80">Competitor analysis</p>
        </div>
        <div className="card stack" style={{ padding: 'var(--svj-space-5)' }}>
          <div className="text-center">
            <h1 className="card-title">{title}</h1>
            {lead ? <p className="text-sm text-muted mt-1">{lead}</p> : null}
          </div>
          {children}
        </div>
        <p className="text-center text-white/75 text-xs mt-6">Privacy-first: first name and last initial only, no photos.</p>
      </div>
    </div>
  );
}
