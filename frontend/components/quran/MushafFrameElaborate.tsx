'use client';

import React from 'react';

/**
 * Elaborate Mushaf Frame Component
 * Detailed ornamental border matching traditional printed Mushaf
 * With intricate Islamic geometric and floral patterns
 */
const MushafFrameElaborate: React.FC = () => {
  return (
    <svg
      className="mushaf-frame-elaborate"
      viewBox="0 0 600 850"
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
        {/* Gradients for rich coloring */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#F4E5A5', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B8860B', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="brownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8B4513', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#A0522D', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#654321', stopOpacity: 1 }} />
        </linearGradient>

        {/* Repeating floral pattern */}
        <pattern id="floralPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="8" fill="url(#goldGrad)" opacity="0.6" />
          <path d="M 20 12 Q 15 15 20 20 Q 25 15 20 12" fill="#8B4513" opacity="0.5" />
          <path d="M 20 28 Q 15 25 20 20 Q 25 25 20 28" fill="#8B4513" opacity="0.5" />
          <path d="M 12 20 Q 15 15 20 20 Q 15 25 12 20" fill="#8B4513" opacity="0.5" />
          <path d="M 28 20 Q 25 15 20 20 Q 25 25 28 20" fill="#8B4513" opacity="0.5" />
        </pattern>

        {/* Geometric pattern */}
        <pattern id="geometricPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect x="10" y="10" width="10" height="10" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.7" />
          <circle cx="15" cy="15" r="3" fill="#C19A6B" opacity="0.6" />
        </pattern>
      </defs>

      {/* OUTER FRAME - Wide decorative border */}

      {/* Top Border - Wide ornamental */}
      <rect x="0" y="0" width="600" height="60" fill="url(#floralPattern)" />
      <rect x="0" y="0" width="600" height="60" fill="url(#brownGrad)" opacity="0.3" />

      {/* Top decorative lines */}
      <rect x="10" y="5" width="580" height="2" fill="url(#goldGrad)" />
      <rect x="10" y="53" width="580" height="2" fill="url(#goldGrad)" />

      {/* Top ornamental details */}
      <g opacity="0.8">
        {Array.from({ length: 15 }).map((_, i) => (
          <g key={`top-${i}`} transform={`translate(${40 + i * 40}, 30)`}>
            <circle r="8" fill="#D4AF37" opacity="0.6" />
            <path d="M -5 0 L 0 -8 L 5 0 L 0 8 Z" fill="#8B4513" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Bottom Border - Wide ornamental */}
      <rect x="0" y="790" width="600" height="60" fill="url(#floralPattern)" />
      <rect x="0" y="790" width="600" height="60" fill="url(#brownGrad)" opacity="0.3" />

      {/* Bottom decorative lines */}
      <rect x="10" y="795" width="580" height="2" fill="url(#goldGrad)" />
      <rect x="10" y="843" width="580" height="2" fill="url(#goldGrad)" />

      {/* Bottom ornamental details */}
      <g opacity="0.8">
        {Array.from({ length: 15 }).map((_, i) => (
          <g key={`bottom-${i}`} transform={`translate(${40 + i * 40}, 820)`}>
            <circle r="8" fill="#D4AF37" opacity="0.6" />
            <path d="M -5 0 L 0 -8 L 5 0 L 0 8 Z" fill="#8B4513" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Left Border - Wide ornamental */}
      <rect x="0" y="60" width="60" height="730" fill="url(#floralPattern)" />
      <rect x="0" y="60" width="60" height="730" fill="url(#brownGrad)" opacity="0.3" />

      {/* Left decorative lines */}
      <rect x="5" y="70" width="2" height="710" fill="url(#goldGrad)" />
      <rect x="53" y="70" width="2" height="710" fill="url(#goldGrad)" />

      {/* Left ornamental details */}
      <g opacity="0.8">
        {Array.from({ length: 18 }).map((_, i) => (
          <g key={`left-${i}`} transform={`translate(30, ${80 + i * 40})`}>
            <circle r="8" fill="#D4AF37" opacity="0.6" />
            <path d="M -5 0 L 0 -8 L 5 0 L 0 8 Z" fill="#8B4513" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* Right Border - Wide ornamental */}
      <rect x="540" y="60" width="60" height="730" fill="url(#floralPattern)" />
      <rect x="540" y="60" width="60" height="730" fill="url(#brownGrad)" opacity="0.3" />

      {/* Right decorative lines */}
      <rect x="543" y="70" width="2" height="710" fill="url(#goldGrad)" />
      <rect x="593" y="70" width="2" height="710" fill="url(#goldGrad)" />

      {/* Right ornamental details */}
      <g opacity="0.8">
        {Array.from({ length: 18 }).map((_, i) => (
          <g key={`right-${i}`} transform={`translate(570, ${80 + i * 40})`}>
            <circle r="8" fill="#D4AF37" opacity="0.6" />
            <path d="M -5 0 L 0 -8 L 5 0 L 0 8 Z" fill="#8B4513" opacity="0.7" />
          </g>
        ))}
      </g>

      {/* CORNER ORNAMENTS - Elaborate designs */}

      {/* Top-Left Corner */}
      <g transform="translate(30, 30)">
        <circle r="20" fill="url(#goldGrad)" opacity="0.8" />
        <path d="M 0 -20 L 10 -10 L 0 0 L -10 -10 Z" fill="#8B4513" />
        <path d="M 0 0 L 10 10 L 0 20 L -10 10 Z" fill="#C19A6B" />
        <circle r="8" fill="#654321" />
      </g>

      {/* Top-Right Corner */}
      <g transform="translate(570, 30)">
        <circle r="20" fill="url(#goldGrad)" opacity="0.8" />
        <path d="M 0 -20 L 10 -10 L 0 0 L -10 -10 Z" fill="#8B4513" />
        <path d="M 0 0 L 10 10 L 0 20 L -10 10 Z" fill="#C19A6B" />
        <circle r="8" fill="#654321" />
      </g>

      {/* Bottom-Left Corner */}
      <g transform="translate(30, 820)">
        <circle r="20" fill="url(#goldGrad)" opacity="0.8" />
        <path d="M 0 -20 L 10 -10 L 0 0 L -10 -10 Z" fill="#8B4513" />
        <path d="M 0 0 L 10 10 L 0 20 L -10 10 Z" fill="#C19A6B" />
        <circle r="8" fill="#654321" />
      </g>

      {/* Bottom-Right Corner */}
      <g transform="translate(570, 820)">
        <circle r="20" fill="url(#goldGrad)" opacity="0.8" />
        <path d="M 0 -20 L 10 -10 L 0 0 L -10 -10 Z" fill="#8B4513" />
        <path d="M 0 0 L 10 10 L 0 20 L -10 10 Z" fill="#C19A6B" />
        <circle r="8" fill="#654321" />
      </g>

      {/* INNER FRAME LINE */}
      <rect
        x="65"
        y="65"
        width="470"
        height="720"
        fill="none"
        stroke="#8B4513"
        strokeWidth="2"
        opacity="0.6"
      />

      {/* Additional decorative elements along inner frame */}
      <rect
        x="70"
        y="70"
        width="460"
        height="710"
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="1"
        strokeDasharray="5,5"
        opacity="0.5"
      />

      {/* Center ornaments on borders */}
      {/* Top center */}
      <g transform="translate(300, 30)">
        <ellipse rx="40" ry="12" fill="url(#goldGrad)" opacity="0.7" />
        <rect x="-30" y="-3" width="60" height="6" fill="#8B4513" opacity="0.8" />
      </g>

      {/* Bottom center */}
      <g transform="translate(300, 820)">
        <ellipse rx="40" ry="12" fill="url(#goldGrad)" opacity="0.7" />
        <rect x="-30" y="-3" width="60" height="6" fill="#8B4513" opacity="0.8" />
      </g>
    </svg>
  );
};

export default MushafFrameElaborate;
