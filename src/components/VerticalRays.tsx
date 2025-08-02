import React from 'react';

export default function VerticalRays({ className = '', style = {} }) {
  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 mx-auto z-0 ${className}`}
      style={{
        top: 0,
        width: '100%',
        height: '180px',
        ...style,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00f5d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[...Array(7)].map((_, i) => (
          <rect
            key={i}
            x={180 + i * 180}
            y="0"
            width="8"
            height="180"
            fill="url(#beam)"
            opacity={0.7 - Math.abs(3 - i) * 0.15}
          />
        ))}
      </svg>
    </div>
  );
}
