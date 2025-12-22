
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '' }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const THRESHOLD = 80; // Pixels to pull before refresh triggers
  const MAX_PULL = 140; // Max visual pull distance

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || isRefreshing) return;
    
    const y = e.touches[0].clientY;
    const diff = y - startY;

    // Only allow pulling if we are at the top and pulling down
    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Add resistance to the pull (logarithmic feel)
      const newY = Math.min(diff * 0.5, MAX_PULL);
      setCurrentY(newY);
      
      // Prevent native scroll if we are pulling down (optional, browser dependent)
      if (e.cancelable && diff < THRESHOLD * 2) {
         // e.preventDefault(); // Often passive, so rely on UI feedback
      }
    } else {
       // Reset if scrolling back up
       setCurrentY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!startY || isRefreshing) return;

    if (currentY > THRESHOLD) {
      setIsRefreshing(true);
      setCurrentY(THRESHOLD); // Snap to threshold
      
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setCurrentY(0);
      }
    } else {
      setCurrentY(0); // Snap back to 0
    }
    setStartY(0);
  };

  // Rotation logic based on pull percentage
  const rotation = Math.min(currentY / THRESHOLD, 1) * 360;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-y-auto overscroll-y-contain ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Spinner Container */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-20"
        style={{ 
          transform: `translateY(${currentY > 0 ? currentY - 40 : -50}px)`,
          transition: isRefreshing ? 'transform 0.2s ease-out' : currentY === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-md border border-slate-200 dark:border-slate-700">
           <RefreshCw 
              size={20} 
              className={`text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} 
              style={{ transform: isRefreshing ? '' : `rotate(${rotation}deg)` }}
           />
        </div>
      </div>

      {/* Content */}
      <div 
        style={{ 
           transform: `translateY(${currentY}px)`,
           transition: isRefreshing ? 'transform 0.2s' : currentY === 0 ? 'transform 0.3s' : 'none'
        }}
        className="min-h-full"
      >
        {children}
      </div>
    </div>
  );
};
