"use client"

import React from 'react';

import { useEffect, useRef } from 'react';

export default function VerticalRays({ className = '', style = {} }) {
  const raysRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.008;
      if (raysRef.current) {
        const rays = raysRef.current.querySelectorAll('rect');
        rays.forEach((ray, i) => {
          const phase = t + i * 0.5;
          const offset = Math.sin(phase) * 18;
          (ray as SVGRectElement).setAttribute('x', String(180 + i * 180 + offset));
          (ray as SVGRectElement).setAttribute('opacity', String(0.5 + 0.2 * Math.sin(phase)));
        });
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={raysRef}
      className={`pointer-events-none absolute left-0 right-0 mx-auto z-0 ${className}`}
      style={{
        top: 0,
        width: '100%',
        height: '180px',
        marginTop: 0,
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
