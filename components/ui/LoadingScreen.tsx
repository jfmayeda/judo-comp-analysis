/** Full-screen navy loading state used while auth and first data resolve. */
export function LoadingScreen({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="loading-screen navy-field" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      <p className="text-sm font-semibold uppercase tracking-wide opacity-90">{label}</p>
    </div>
  );
}

/** Inline placeholder for a section that is still loading. */
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted py-2" role="status" aria-live="polite">
      <span className="spinner spinner-dark" style={{ width: 18, height: 18, borderWidth: 2 }} aria-hidden />
      <span>{label}…</span>
    </div>
  );
}
