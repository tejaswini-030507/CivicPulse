import React from 'react';

const CivicPulseLogo = ({ variant = 'horizontal', height = 40 }) => {
  const iconH = variant === 'stacked' ? height * 0.65 : height;
  const scale = iconH / 120;
  const w = 100 * scale;
  const h = 120 * scale;

  const Icon = () => (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pin shape - Top arch and tapering bottom */}
      <path
        d="M50 5 C30 5 14 21 14 41 C14 65 50 115 50 115 C50 115 86 65 86 41 C86 21 70 5 50 5Z"
        fill="#1A6B5A"
      />
      {/* Darker right half for depth */}
      <path
        d="M50 5 C70 5 86 21 86 41 C86 65 50 115 50 115 L50 5Z"
        fill="#0F4C35"
      />
      {/* White circle centered in top portion */}
      <circle cx="50" cy="41" r="21" fill="white" />
      {/* Person Silhouette inside circle */}
      <circle cx="50" cy="34" r="7" fill="#1A6B5A" />
      <path
        d="M33 56 C33 48 40 43 50 43 C60 43 67 48 67 56"
        fill="#1A6B5A"
      />
      {/* Pulse line strictly BELOW the circle (circle ends at y=62) */}
      {/* White outline for pulse line visibility over pin */}
      <path
        d="M10 85 L32 85 L40 70 L48 100 L56 85 L90 85"
        stroke="white"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Amber pulse line */}
      <path
        d="M10 85 L32 85 L40 70 L48 100 L56 85 L90 85"
        stroke="#F4A026"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <Icon />;
  }

  if (variant === 'stacked') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Icon />
        <span style={{
          fontSize: height * 0.32,
          fontWeight: '800',
          color: '#1A6B5A',
          letterSpacing: '-0.5px',
          lineHeight: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          CivicPulse
        </span>
        <span style={{
          fontSize: height * 0.16,
          color: '#6B7280',
          fontStyle: 'italic',
          letterSpacing: '0.01em',
          lineHeight: 1
        }}>
          Connecting Needs with Action
        </span>
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: height * 0.22
    }}>
      <Icon />
      <span style={{
        fontSize: height * 0.5,
        fontWeight: '800',
        color: '#1A6B5A',
        letterSpacing: '-0.5px',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        CivicPulse
      </span>
    </div>
  );
};

export default CivicPulseLogo;
