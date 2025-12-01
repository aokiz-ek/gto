'use client';

import { useState, useCallback, useRef, CSSProperties } from 'react';

// Hover state hook
export function useHover() {
  const [isHovered, setIsHovered] = useState(false);

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, handlers };
}

// Press/Active state hook
export function usePress() {
  const [isPressed, setIsPressed] = useState(false);

  const handlers = {
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  };

  return { isPressed, handlers };
}

// Combined hover and press
export function useInteraction() {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlers = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
  };

  return { isHovered, isPressed, handlers };
}

// Ripple effect hook
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const nextId = useRef(0);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = nextId.current++;

    setRipples(prev => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}

// Animation styles generator
export const getAnimationStyles = {
  // Hover lift effect
  hoverLift: (isHovered: boolean, isPressed: boolean): CSSProperties => ({
    transform: isPressed
      ? 'translateY(0) scale(0.98)'
      : isHovered
      ? 'translateY(-2px)'
      : 'translateY(0)',
    boxShadow: isPressed
      ? '0 2px 4px rgba(0, 0, 0, 0.2)'
      : isHovered
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 1px 2px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  }),

  // Scale effect
  hoverScale: (isHovered: boolean, isPressed: boolean, scale = 1.02): CSSProperties => ({
    transform: isPressed
      ? 'scale(0.98)'
      : isHovered
      ? `scale(${scale})`
      : 'scale(1)',
    transition: 'transform 0.15s ease',
  }),

  // Glow effect
  hoverGlow: (isHovered: boolean, color = 'rgba(34, 211, 191, 0.3)'): CSSProperties => ({
    boxShadow: isHovered ? `0 0 20px ${color}` : 'none',
    transition: 'box-shadow 0.2s ease',
  }),

  // Brightness effect
  hoverBrightness: (isHovered: boolean, isPressed: boolean): CSSProperties => ({
    filter: isPressed
      ? 'brightness(0.9)'
      : isHovered
      ? 'brightness(1.1)'
      : 'brightness(1)',
    transition: 'filter 0.15s ease',
  }),

  // Border glow effect
  borderGlow: (isHovered: boolean, color = '#22d3bf'): CSSProperties => ({
    borderColor: isHovered ? color : '#333333',
    boxShadow: isHovered ? `0 0 10px ${color}40` : 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  }),

  // Card hover effect
  cardHover: (isHovered: boolean): CSSProperties => ({
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered
      ? '0 8px 25px rgba(0, 0, 0, 0.4)'
      : '0 2px 8px rgba(0, 0, 0, 0.2)',
    borderColor: isHovered ? '#22d3bf' : '#333333',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
  }),

  // Button press effect
  buttonPress: (isPressed: boolean): CSSProperties => ({
    transform: isPressed ? 'scale(0.96)' : 'scale(1)',
    transition: 'transform 0.1s ease',
  }),

  // Icon spin on hover
  iconSpin: (isHovered: boolean): CSSProperties => ({
    transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.3s ease',
  }),

  // Slide in from direction
  slideIn: (direction: 'up' | 'down' | 'left' | 'right', isVisible: boolean): CSSProperties => {
    const transforms = {
      up: 'translateY(10px)',
      down: 'translateY(-10px)',
      left: 'translateX(10px)',
      right: 'translateX(-10px)',
    };
    return {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translate(0)' : transforms[direction],
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    };
  },
};

// Transition presets
export const transitions = {
  fast: 'all 0.1s ease',
  normal: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  spring: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Easing functions
export const easings = {
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};
