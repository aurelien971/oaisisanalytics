// Icons drawn in the SF Symbols idiom — 1.4 stroke on a 24 grid, round caps
// and joins, no fills. Apple's own set can't be shipped on the web, so these
// match its geometry rather than approximating it with something heavier.
const paths = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="2.2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2.2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2.2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2.2" /></>,
  gauge: <><path d="M3.6 17.5a9 9 0 1 1 16.8 0" /><path d="M12 13.6 15.8 9" /></>,
  sliders: <><path d="M4 8h9M17 8h3M4 16h3M11 16h9" /><circle cx="15" cy="8" r="2.1" /><circle cx="9" cy="16" r="2.1" /></>,
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M3.4 19.4c.6-3 2.9-4.7 5.6-4.7s5 1.7 5.6 4.7" /><path d="M16.2 5.2a3.2 3.2 0 0 1 0 5.9M17.4 14.9c2 .6 3.4 2.2 3.9 4.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.6" /><path d="M12 7.2V12l3.2 2" /></>,
  quote: <><path d="M20.4 12.6c0 4-3.6 7-8.4 7a10 10 0 0 1-2.9-.4L4.4 21l1.2-3.4A6.7 6.7 0 0 1 3.6 12.6c0-4 3.7-7 8.4-7s8.4 3 8.4 7Z" /></>,
  send: <><path d="M20.6 3.9 3.6 10.3l7 2.8 2.8 7 7.2-16.2Z" /><path d="m10.6 13.1 4-4" /></>,
  waveform: <><path d="M3.5 11v2M7.2 7.6v8.8M11 4.4v15.2M14.8 8.4v7.2M18.5 10.4v3.2M21.8 11.4v1.2" /></>,
  shield: <><path d="M12 3.2 5 6v5.4c0 4.2 2.8 7.6 7 9.4 4.2-1.8 7-5.2 7-9.4V6l-7-2.8Z" /><path d="m9.2 12.1 2 2 3.6-3.9" /></>,
  back: <><path d="M14.5 6.5 9 12l5.5 5.5" /></>,
  arrow: <><path d="M5 12h13.5M13 6.4 18.8 12 13 17.6" /></>,
  exit: <><path d="M14.5 8V6.2a2 2 0 0 0-2-2H6.2a2 2 0 0 0-2 2v11.6a2 2 0 0 0 2 2h6.3a2 2 0 0 0 2-2V16" /><path d="M10 12h10.4M17.4 8.9 20.5 12l-3.1 3.1" /></>,
  link: <><path d="M10.4 13.6a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4" /><path d="M13.6 10.4a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4" /></>,
  lock: <><rect x="4.6" y="10.4" width="14.8" height="9.6" rx="3" /><path d="M8.2 10.4V7.8a3.8 3.8 0 0 1 7.6 0v2.6" /></>,
};

export default function Icon({ name, size = 16, className = "" }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {d}
    </svg>
  );
}

/** The wordmark's ring — a hairline circle with one lit arc. */
export function Mark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-mark" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.3" />
      <path d="M12 3a9 9 0 0 1 8.6 6.4" stroke="#C8E6CC" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="#C8E6CC" fillOpacity="0.85" />
    </svg>
  );
}
