import React from 'react';

type P = {size?: number; color?: string; stroke?: number; style?: React.CSSProperties};

const Base: React.FC<P & {children: React.ReactNode}> = ({size = 24, color = 'currentColor', stroke = 1.8, style, children}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const IServer: React.FC<P> = (p) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="7" rx="2" />
    <rect x="3" y="13" width="18" height="7" rx="2" />
    <path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6" />
  </Base>
);
export const IPulse: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />
  </Base>
);
export const IUsers: React.FC<P> = (p) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
    <path d="M16 4.8a3.3 3.3 0 0 1 0 6.4M18.5 14.8c1.6.8 2.6 2.5 3 5.2" />
  </Base>
);
export const IBroom: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M12 3v7" />
    <path d="M7 10h10l1.5 10h-13z" />
    <path d="M10 14v6M14 14v6" />
  </Base>
);
export const ICart: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M3 4h2.2l2.3 11h10.2l2.1-8H6.4" />
    <circle cx="9" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </Base>
);
export const ICard: React.FC<P> = (p) => (
  <Base {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M6 15h4" />
  </Base>
);
export const ICheck: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);
export const IBolt: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12z" />
  </Base>
);
export const ISend: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M21.5 2.5L10.5 13.5" />
    <path d="M21.5 2.5l-7 19-4-8-8-4z" />
  </Base>
);
export const IBell: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Base>
);
export const ICpu: React.FC<P> = (p) => (
  <Base {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
  </Base>
);
export const ILayers: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M12 3l9 5-9 5-9-5z" />
    <path d="M3 13l9 5 9-5" />
  </Base>
);
export const IPlay: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M7 4.5v15l12.5-7.5z" />
  </Base>
);
export const IFilm: React.FC<P> = (p) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
  </Base>
);
export const ISpark: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z" />
    <path d="M19 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.2-2.2.9-2.5 2.5-.3-1.6-1-2.3-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5z" />
  </Base>
);
export const IChat: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M4 5.5h16v10H9l-5 4z" />
  </Base>
);
export const IBox: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M12 2.5l8.5 4.5v10L12 21.5 3.5 17V7z" />
    <path d="M3.5 7L12 11.5 20.5 7M12 11.5v10" />
  </Base>
);
export const IArrow: React.FC<P> = (p) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const IGlobe: React.FC<P> = (p) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
  </Base>
);
