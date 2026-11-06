import React from 'react';

// Hand-made line icons (24x24 grid, stroke based) — no emoji anywhere.
const P: Record<string, React.ReactNode> = {
  shield: <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6l-8-3Z" />,
  shieldCheck: (
    <>
      <path d="M12 2.5 4 5.5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10v-6l-8-3Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  bug: (
    <>
      <rect x="7" y="7" width="10" height="13" rx="5" />
      <path d="M12 11v9M7 12H3m18 0h-4M7 17H4m16 0h-3M8.5 7.5 6.5 4.5m9 3 2-3M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  terminal: (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  star: <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" />,
  code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2.5-12-3 14" />,
  grad: (
    <>
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6" />
    </>
  ),
  laptop: (
    <>
      <rect x="4" y="4.5" width="16" height="11" rx="1.5" />
      <path d="M2 19.5h20l-2-4H4l-2 4Z" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="3.5" width="18" height="7" rx="2" />
      <rect x="3" y="13.5" width="18" height="7" rx="2" />
      <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5M12 14.5v2.5" />
    </>
  ),
  repo: (
    <>
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5v-16Z" />
      <path d="M5 20.5A2.5 2.5 0 0 0 7.5 23H19v-5M9 6h6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  fork: (
    <>
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <circle cx="12" cy="19" r="2.2" />
      <path d="M6 7.2v1.3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7.2M12 11.5v5.3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3.5M8 21h8M9.5 21l.5-3.5h4l.5 3.5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20.5h20L12 3Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  book: (
    <>
      <path d="M3 5c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0V5Zm9 0c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0" />
    </>
  ),
  docker: (
    <>
      <path d="M2.5 12.5h17c1.6 0 2.4-1.4 2.5-2.5-1-.6-2.3-.5-3 0-.3-1.3-1.2-2-2-2.5-.6 1-.7 2.3-.3 3" />
      <path d="M2.5 12.5c.5 4.5 4 7 9 7 4.6 0 7.6-2.3 9-6.3" />
      <path d="M5 9.5h3v3H5zm3.5 0h3v3h-3zm3.5 0h3v3h-3zm-3.5-3.5h3v3h-3zm3.5 0h3v3h-3z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c3 3 3.8 6 3.8 9.5S15 18.5 12 21.5C9 18.5 8.2 15.5 8.2 12S9 5.5 12 2.5Z" />
    </>
  ),
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  cursor: <path d="M5 3l14 7.5-6.2 1.6L10 18.5 5 3Z" />,
  wrench: <path d="M14.5 6.5a4.5 4.5 0 0 0 5.6 5.6L13 19.2a2.5 2.5 0 0 1-3.5-3.5L16.6 8.6M14.5 6.5l3-3a4.5 4.5 0 0 1 3 3l-3 3" />,
  scan: (
    <>
      <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
      <path d="M3 12h18" />
    </>
  ),
};

export const Icon: React.FC<{
  name: keyof typeof P | string;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: React.CSSProperties;
  /** 0..1 draws the stroke progressively */
  draw?: number;
}> = ({name, size = 32, color = 'currentColor', stroke = 1.8, fill = 'none', style, draw}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      overflow: 'visible',
      ...(draw !== undefined
        ? ({strokeDasharray: 100, strokeDashoffset: 100 * (1 - draw)} as React.CSSProperties)
        : {}),
      ...style,
    }}
    // pathLength normalises dash animation for every child path
  >
    <g {...(draw !== undefined ? {pathLength: 100} : {})}>
      {React.Children.map(
        (P[name] as React.ReactElement)?.type === React.Fragment
          ? (P[name] as React.ReactElement).props.children
          : P[name],
        (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<any>, draw !== undefined ? {pathLength: 100} : {})
            : child,
      )}
    </g>
  </svg>
);
