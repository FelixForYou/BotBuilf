import { cx } from "./ui";

/** Maskot FxB: wajah "‹ ‿ ›" dalam tudung mint — identitas FELIXIORITY. */
export function Mascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cx("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="fxb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ef0d6" />
          <stop offset="1" stopColor="#2fbf9f" />
        </linearGradient>
      </defs>
      <path d="M32 3C17 3 7 15 7 30c0 9 3 16 8 22 3 4 9 7 17 7s14-3 17-7c5-6 8-13 8-22C57 15 47 3 32 3Z" fill="url(#fxb-g)" />
      <path d="M32 15c-9.5 0-16 7-16 16 0 8.5 6.5 15 16 15s16-6.5 16-15c0-9-6.5-16-16-16Z" fill="#0b1f1b" />
      <path d="M24 27l-4 4 4 4M40 27l4 4-4 4" stroke="#e8fff9" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 36c2.4 2 5.6 2 8 0" stroke="#e8fff9" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Smiley({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <circle cx="11" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="21" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <path d="M6 17c0 1 1 4 3 4M26 17c0 1-1 4-3 4M10 22c3.5 2.6 8.5 2.6 12 0" />
    </svg>
  );
}
