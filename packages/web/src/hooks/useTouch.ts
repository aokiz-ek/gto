'use client';

import { useState, useCallback, useRef } from 'react';

// Touch direction types
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface TouchState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isSwiping: boolean;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe (default 50px)
  preventScroll?: boolean;
}

export function useSwipe(options: UseSwipeOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventScroll = false,
  } = options;

  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    isSwiping: false,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchState.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      endX: e.touches[0].clientX,
      endY: e.touches[0].clientY,
      isSwiping: true,
    };
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current.isSwiping) return;

    touchState.current.endX = e.touches[0].clientX;
    touchState.current.endY = e.touches[0].clientY;

    if (preventScroll) {
      const deltaX = Math.abs(touchState.current.endX - touchState.current.startX);
      const deltaY = Math.abs(touchState.current.endY - touchState.current.startY);

      // If horizontal swipe is dominant, prevent vertical scroll
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback(() => {
    const { startX, startY, endX, endY, isSwiping } = touchState.current;

    if (!isSwiping) return;

    touchState.current.isSwiping = false;

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine swipe direction
    if (absDeltaX < threshold && absDeltaY < threshold) {
      setSwipeDirection(null);
      return;
    }

    let direction: SwipeDirection = null;

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > threshold) {
        direction = 'right';
        onSwipeRight?.();
      } else if (deltaX < -threshold) {
        direction = 'left';
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > threshold) {
        direction = 'down';
        onSwipeDown?.();
      } else if (deltaY < -threshold) {
        direction = 'up';
        onSwipeUp?.();
      }
    }

    setSwipeDirection(direction);
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swipeDirection,
  };
}

// Long press hook
interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  duration?: number; // Long press duration in ms (default 500)
}

export function useLongPress(options: UseLongPressOptions) {
  const { onLongPress, onClick, duration = 500 } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const start = useCallback(() => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPress.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: () => {
        clear();
        handleClick();
      },
      onTouchMove: clear,
      onMouseDown: start,
      onMouseUp: () => {
        clear();
        handleClick();
      },
      onMouseLeave: clear,
    },
  };
}

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80 } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when scrolled to top
    const target = e.target as HTMLElement;
    const scrollTop = target.closest('[data-scroll-container]')?.scrollTop ?? window.scrollY;

    if (scrollTop === 0) {
      setCanPull(true);
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPull || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance
      const distance = Math.min(diff * 0.4, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [canPull, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPull) return;

    setCanPull(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [canPull, pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    pullDistance,
    isRefreshing,
    isReadyToRefresh: pullDistance >= threshold,
  };
}

// Pinch zoom hook (for images, charts, etc.)
interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
}

export function usePinchZoom(options: UsePinchZoomOptions = {}) {
  const { minScale = 1, maxScale = 3, onScaleChange } = options;

  const [scale, setScale] = useState(1);
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;

    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current > 0) {
      const currentDistance = getDistance(e.touches);
      const ratio = currentDistance / initialDistance.current;
      const newScale = Math.min(maxScale, Math.max(minScale, initialScale.current * ratio));

      setScale(newScale);
      onScaleChange?.(newScale);
    }
  }, [minScale, maxScale, onScaleChange]);

  const handleTouchEnd = useCallback(() => {
    initialDistance.current = 0;
  }, []);

  const resetScale = useCallback(() => {
    setScale(1);
    onScaleChange?.(1);
  }, [onScaleChange]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    scale,
    resetScale,
  };
}

// Double tap hook
interface UseDoubleTapOptions {
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number; // Time between taps (default 300ms)
}

export function useDoubleTap(options: UseDoubleTapOptions) {
  const { onDoubleTap, onSingleTap, delay = 300 } = options;

  const lastTap = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();

    if (now - lastTap.current < delay) {
      // Double tap detected
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onDoubleTap();
      lastTap.current = 0;
    } else {
      // Single tap - wait to see if there's a second tap
      lastTap.current = now;

      if (onSingleTap) {
        timerRef.current = setTimeout(() => {
          onSingleTap();
          timerRef.current = null;
        }, delay);
      }
    }
  }, [delay, onDoubleTap, onSingleTap]);

  return {
    handlers: {
      onClick: handleTap,
    },
  };
}
