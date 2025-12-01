'use client';

import { useState, useEffect } from 'react';

// Breakpoints
export const BREAKPOINTS = {
  mobile: 639,
  tablet: 1023,
  desktop: 1024,
} as const;

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      if (width <= BREAKPOINTS.mobile) {
        setScreenSize('mobile');
      } else if (width <= BREAKPOINTS.tablet) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Initial check
    updateSize();

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return {
    screenSize,
    windowWidth,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
  };
}

// Responsive style helper
export function responsive<T>(options: {
  mobile?: T;
  tablet?: T;
  desktop: T;
}, screenSize: ScreenSize): T {
  if (screenSize === 'mobile' && options.mobile !== undefined) {
    return options.mobile;
  }
  if (screenSize === 'tablet' && options.tablet !== undefined) {
    return options.tablet;
  }
  if (screenSize === 'mobile' && options.tablet !== undefined) {
    return options.tablet;
  }
  return options.desktop;
}
