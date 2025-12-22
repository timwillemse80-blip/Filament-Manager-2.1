import React from 'react';
import { useLogo } from '../contexts/LogoContext';

interface LogoProps {
  className?: string;
  strokeWidth?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-6 h-6", strokeWidth = 2.5 }) => {
  // Try to use the logo context safely
  let logoUrl = null;
  try {
    const ctx = useLogo();
    logoUrl = ctx.logoUrl;
  } catch (e) {
    // If context is missing (e.g. tests), ignore
  }

  // Use useId for unique IDs
  const gradId = React.useId();

  if (logoUrl) {
    return (
      <img 
        src={logoUrl} 
        alt="Logo" 
        className={`${className} object-contain`} 
        crossOrigin="anonymous"
      />
    );
  }
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>

      {/* Filament Strand (Orange) */}
      <path 
        d="M21 12 L21 3.5" 
        stroke="#F97316" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M21 3.5 L15 3.5" 
        stroke="#F97316" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Outer Spool Circle (Blue Gradient) */}
      <path 
        d="M21 12a9 9 0 1 1-6.219-8.56" 
        stroke={`url(#${gradId})`} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Inner Hub (Solid Blue) */}
      <circle 
        cx="12" 
        cy="12" 
        r="2.5" 
        fill="#1E40AF" 
        stroke="none" 
      />

      {/* --- CHRISTMAS HAT --- */}
      <g transform="translate(-1, -1)">
        {/* Red Body (Floppy part) */}
        <path 
          d="M7 6 Q 7 0 2 3 L 13 7" 
          fill="#DC2626" 
          stroke="#DC2626" 
          strokeWidth="1" 
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M7 6 L 13 7 L 16 7 L 7 6" 
          fill="#DC2626" 
        />
        
        {/* White Trim (Band) */}
        <path 
          d="M6 6 L 16 8" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        
        {/* Pom Pom (Ball) */}
        <circle cx="2" cy="3" r="1.8" fill="white" />
      </g>

      {/* Gloss/Reflection (Moved slightly to not interfere with hat) */}
      <path 
        d="M12 18.5 a6.5 6.5 0 0 0 4.5 -4.5" 
        opacity="0.3" 
        stroke="white" 
        strokeWidth={1.5} 
        strokeLinecap="round"
      />
    </svg>
  );
};