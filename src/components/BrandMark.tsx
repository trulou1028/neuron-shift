/** Two redundant paths that split and rejoin: the A/B power path this prototype is about. */
export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12H7l3-4.5h4L17 12h4.5" />
        <path d="M7 12l3 4.5h4L17 12" />
        <circle cx="7" cy="12" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="17" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
