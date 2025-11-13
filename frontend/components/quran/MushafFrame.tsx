'use client';

import React from 'react';

/**
 * Mushaf Frame Component
 * Traditional ornamental border frame for Quran pages
 * Mimics the decorative borders found in printed Mushaf
 */
const MushafFrame: React.FC = () => {
  return (
    <svg
      className="mushaf-frame"
      viewBox="0 0 600 800"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for golden frame */}
        <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#C19A6B', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
        </linearGradient>

        {/* Pattern for decorative elements */}
        <pattern id="decorPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="#C19A6B" opacity="0.3" />
        </pattern>
      </defs>

      {/* Outer border */}
      <rect
        x="10"
        y="10"
        width="580"
        height="780"
        fill="none"
        stroke="url(#frameGradient)"
        strokeWidth="3"
        rx="5"
      />

      {/* Inner border */}
      <rect
        x="20"
        y="20"
        width="560"
        height="760"
        fill="none"
        stroke="url(#frameGradient)"
        strokeWidth="2"
        rx="3"
      />

      {/* Decorative corners - Top Left */}
      <path
        d="M 25 25 L 60 25 L 45 40 L 25 60 Z"
        fill="url(#frameGradient)"
        opacity="0.6"
      />
      <circle cx="35" cy="35" r="3" fill="#D4AF37" />

      {/* Decorative corners - Top Right */}
      <path
        d="M 575 25 L 540 25 L 555 40 L 575 60 Z"
        fill="url(#frameGradient)"
        opacity="0.6"
      />
      <circle cx="565" cy="35" r="3" fill="#D4AF37" />

      {/* Decorative corners - Bottom Left */}
      <path
        d="M 25 775 L 60 775 L 45 760 L 25 740 Z"
        fill="url(#frameGradient)"
        opacity="0.6"
      />
      <circle cx="35" cy="765" r="3" fill="#D4AF37" />

      {/* Decorative corners - Bottom Right */}
      <path
        d="M 575 775 L 540 775 L 555 760 L 575 740 Z"
        fill="url(#frameGradient)"
        opacity="0.6"
      />
      <circle cx="565" cy="765" r="3" fill="#D4AF37" />

      {/* Top center decoration */}
      <g transform="translate(300, 15)">
        <path
          d="M -20 0 Q -10 -5, 0 0 Q 10 -5, 20 0 L 15 10 Q 0 5, -15 10 Z"
          fill="url(#frameGradient)"
        />
        <circle cx="0" cy="5" r="2" fill="#D4AF37" />
      </g>

      {/* Bottom center decoration */}
      <g transform="translate(300, 785)">
        <path
          d="M -20 0 Q -10 5, 0 0 Q 10 5, 20 0 L 15 -10 Q 0 -5, -15 -10 Z"
          fill="url(#frameGradient)"
        />
        <circle cx="0" cy="-5" r="2" fill="#D4AF37" />
      </g>

      {/* Side decorations - Left */}
      <g transform="translate(15, 400)">
        <ellipse cx="0" cy="0" rx="3" ry="15" fill="url(#frameGradient)" opacity="0.5" />
        <circle cx="0" cy="0" r="2" fill="#D4AF37" />
      </g>

      {/* Side decorations - Right */}
      <g transform="translate(585, 400)">
        <ellipse cx="0" cy="0" rx="3" ry="15" fill="url(#frameGradient)" opacity="0.5" />
        <circle cx="0" cy="0" r="2" fill="#D4AF37" />
      </g>

      {/* Decorative lines - top */}
      <line x1="80" y1="15" x2="520" y2="15" stroke="url(#frameGradient)" strokeWidth="1" opacity="0.4" />

      {/* Decorative lines - bottom */}
      <line x1="80" y1="785" x2="520" y2="785" stroke="url(#frameGradient)" strokeWidth="1" opacity="0.4" />
    </svg>
  );
};

export default MushafFrame;
