import React from 'react';

interface TradeEliteLogoProps {
  /** Controls rendered width. Height scales proportionally. Default: 380 */
  width?: number;
  /** Optional className for styling the SVG element */
  className?: string;
  /** Show wordmark + caption alongside icon. Default: true */
  showWordmark?: boolean;
}

/**
 * TradeElite.ai — Primary Logo Component
 *
 * Fonts used: Orbitron (700, 900), Share Tech Mono
 * Add this to your index.html <head> or global CSS:
 *
 *   @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
 */
const TradeEliteLogo: React.FC<TradeEliteLogoProps> = ({
  width = 380,
  className = '',
  showWordmark = true,
}) => {
  // viewBox is 380×86 (horizontal) or 72×86 (icon only)
  const viewBoxWidth  = showWordmark ? 380 : 86;
  const viewBoxHeight = 86;
  const height = (width / viewBoxWidth) * viewBoxHeight;

  // Unique ID prefix to avoid gradient/filter clashes if logo
  // is rendered multiple times on the same page
  const uid = 'te_logo';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeElite.ai"
      role="img"
      className={className}
    >
      <defs>
        {/* ── Gradients ── */}
        <linearGradient id={`${uid}_stem`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#00b8a0" />
          <stop offset="100%" stopColor="#0a3a80" />
        </linearGradient>

        <linearGradient id={`${uid}_ebar`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1565c0" />
          <stop offset="100%" stopColor="#0d47a1" />
        </linearGradient>

        <linearGradient id={`${uid}_arr`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1565c0" />
          <stop offset="100%" stopColor="#00b8a0" />
        </linearGradient>

        <linearGradient id={`${uid}_bull`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#0a4060" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#00b8a0" />
        </linearGradient>

        <linearGradient id={`${uid}_bear`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%"   stopColor="#3a2800" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#f9a825" />
        </linearGradient>

        <linearGradient id={`${uid}_elite`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#00b8a0" />
          <stop offset="100%" stopColor="#1565c0" />
        </linearGradient>

        {/* ── Filters ── */}
        <filter id={`${uid}_glow`}>
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${uid}_soft`}>
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══════════════════════════════
          ICON MARK
      ══════════════════════════════ */}

      {/* Arrow ^ — key bow, tip at (36,4), arms end at y=28 */}
      <path
        d="M 36 4 L 8 28 L 18 28"
        stroke={`url(#${uid}_arr)`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${uid}_glow)`}
      />
      <path
        d="M 36 4 L 64 28 L 54 28"
        stroke={`url(#${uid}_arr)`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${uid}_glow)`}
      />
      {/* Arrow tip node */}
      <circle cx="36" cy="4" r="3.5" fill="#00b8a0" filter={`url(#${uid}_glow)`} />

      {/* T Stem — key shaft, y=28–84 */}
      <rect x="28" y="28" width="16" height="56" rx="2" fill={`url(#${uid}_stem)`} opacity={0.9} />
      <rect x="28" y="28" width="1.5" height="56" rx=".75" fill="rgba(0,184,160,0.45)" />

      {/* ── Mini Candlestick Chart — 2 columns × 2 rows ── */}

      {/* Col A Row 1: gold/bear */}
      <line x1="31.5" y1="30"  x2="31.5" y2="31.5" stroke="#f9a825" strokeWidth="0.7" opacity="0.7" />
      <rect x="30" y="31.5" width="3" height="7"   rx="0.4" fill={`url(#${uid}_bear)`} />
      <rect x="30" y="31.5" width="3" height="1.3" rx="0.4" fill="#f9a825" opacity="0.85" />
      <line x1="31.5" y1="38.5" x2="31.5" y2="40" stroke="#f9a825" strokeWidth="0.7" opacity="0.7" />

      {/* Col B Row 1: teal/bull */}
      <line x1="35.5" y1="31"  x2="35.5" y2="32.5" stroke="#00b8a0" strokeWidth="0.7" opacity="0.7" />
      <rect x="34" y="32.5" width="3" height="5"   rx="0.4" fill={`url(#${uid}_bull)`} />
      <rect x="34" y="32.5" width="3" height="1.3" rx="0.4" fill="#00b8a0" opacity="0.9" />
      <line x1="35.5" y1="37.5" x2="35.5" y2="39" stroke="#00b8a0" strokeWidth="0.7" opacity="0.7" />

      {/* Col A Row 2: teal/bull */}
      <line x1="31.5" y1="41"  x2="31.5" y2="42.5" stroke="#00b8a0" strokeWidth="0.7" opacity="0.7" />
      <rect x="30" y="42.5" width="3" height="6"   rx="0.4" fill={`url(#${uid}_bull)`} />
      <rect x="30" y="42.5" width="3" height="1.3" rx="0.4" fill="#00b8a0" opacity="0.9" />
      <line x1="31.5" y1="48.5" x2="31.5" y2="50" stroke="#00b8a0" strokeWidth="0.7" opacity="0.7" />

      {/* Col B Row 2: gold/bear tall */}
      <line x1="35.5" y1="40"  x2="35.5" y2="41.5" stroke="#f9a825" strokeWidth="0.7" opacity="0.7" />
      <rect x="34" y="41.5" width="3" height="8"   rx="0.4" fill={`url(#${uid}_bear)`} />
      <rect x="34" y="41.5" width="3" height="1.3" rx="0.4" fill="#f9a825" opacity="0.85" />
      <line x1="35.5" y1="49.5" x2="35.5" y2="51" stroke="#f9a825" strokeWidth="0.7" opacity="0.7" />

      {/* ── E Bars — key teeth, lower stem ── */}
      {/* Top bar */}
      <rect x="44" y="54" width="20" height="7" rx="1.5" fill={`url(#${uid}_ebar)`} />
      <rect x="44" y="54" width="2"  height="7" rx="1"   fill="rgba(0,184,160,0.7)" />
      {/* Mid bar */}
      <rect x="44" y="64" width="15" height="7" rx="1.5" fill={`url(#${uid}_ebar)`} opacity={0.85} />
      <rect x="44" y="64" width="2"  height="7" rx="1"   fill="rgba(0,184,160,0.6)" />
      {/* Bottom bar */}
      <rect x="44" y="74" width="20" height="7" rx="1.5" fill={`url(#${uid}_ebar)`} />
      <rect x="44" y="74" width="2"  height="7" rx="1"   fill="rgba(0,184,160,0.7)" />

      {/* ── AI Nodes at T+E junctions ── */}
      <circle cx="44" cy="57.5" r="3"   fill="#07101e" stroke="#00b8a0" strokeWidth="1.2" filter={`url(#${uid}_soft)`} />
      <circle cx="44" cy="57.5" r="1.1" fill="#00b8a0" />
      <circle cx="44" cy="67.5" r="3"   fill="#07101e" stroke="#1565c0" strokeWidth="1.2" filter={`url(#${uid}_soft)`} />
      <circle cx="44" cy="67.5" r="1.1" fill="#1565c0" />
      <circle cx="44" cy="77.5" r="3"   fill="#07101e" stroke="#00b8a0" strokeWidth="1.2" filter={`url(#${uid}_soft)`} />
      <circle cx="44" cy="77.5" r="1.1" fill="#00b8a0" />

      {/* ── AI Circuit Traces off E bars ── */}
      <line x1="63" y1="57.5" x2="71" y2="57.5" stroke="#00b8a0" strokeWidth="0.8" opacity="0.5" />
      <circle cx="72.5" cy="57.5" r="1.6" fill="none" stroke="#00b8a0" strokeWidth="0.8" opacity="0.5" />

      <line x1="58" y1="67.5" x2="58" y2="61"   stroke="#1565c0" strokeWidth="0.8" opacity="0.4" />
      <line x1="58" y1="61"   x2="64" y2="61"   stroke="#1565c0" strokeWidth="0.8" opacity="0.4" />
      <circle cx="65.5" cy="61" r="1.5" fill="none" stroke="#1565c0" strokeWidth="0.8" opacity="0.4" />

      <line x1="63" y1="77.5" x2="69" y2="77.5" stroke="#00b8a0" strokeWidth="0.8" opacity="0.45" />
      <circle cx="70.5" cy="77.5" r="1.5" fill="none" stroke="#00b8a0" strokeWidth="0.8" opacity="0.45" />

      {/* ══════════════════════════════
          WORDMARK (optional)
      ══════════════════════════════ */}
      {showWordmark && (
        <>
          <text
            x="90"
            y="43"
            fontFamily="var(--font-orbitron), 'Orbitron', monospace"
            fontWeight="900"
            fontSize="26"
            letterSpacing="1"
          >
            <tspan fill="#e8f4ff">TRADE</tspan>
            <tspan fill={`url(#${uid}_elite)`}>ELITE</tspan>
            <tspan
              fontFamily="var(--font-share-tech-mono), 'Share Tech Mono', monospace"
              fontSize="11"
              fill="#00b8a0"
              dy="-5"
            >.ai</tspan>
          </text>

          <line x1="90" y1="53" x2="372" y2="53" stroke="#0e2040" strokeWidth="0.8" />

          <text
            x="90"
            y="67"
            fontFamily="var(--font-share-tech-mono), 'Share Tech Mono', monospace"
            fontSize="8"
            fill="#2a4a6a"
            letterSpacing="2.5"
          >
            AI POWERED TRADING INTELLIGENCE
          </text>
        </>
      )}
    </svg>
  );
};

export default TradeEliteLogo;
