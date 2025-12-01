'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSwipe } from '@/hooks';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights as percentages (e.g., [50, 90])
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [50],
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentTranslate = useRef(0);
  const isDragging = useRef(false);

  // Handle swipe down to close
  const { handlers: swipeHandlers } = useSwipe({
    onSwipeDown: () => {
      if (contentRef.current?.scrollTop === 0) {
        onClose();
      }
    },
    threshold: 80,
  });

  // Handle drag gesture on handle
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentTranslate.current = 0;
    isDragging.current = true;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0) {
      currentTranslate.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (currentTranslate.current > 100) {
        onClose();
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset transform when opening
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`bottom-sheet-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        style={{
          maxHeight: `${snapPoints[0]}vh`,
        }}
      >
        {/* Drag Handle */}
        <div
          className="bottom-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab' }}
        />

        {/* Title */}
        {title && (
          <div style={{
            padding: '0 16px 12px',
            borderBottom: '1px solid var(--surface-border)',
          }}>
            <h2
              id="bottom-sheet-title"
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="bottom-sheet-content"
          {...swipeHandlers}
        >
          {children}
        </div>
      </div>
    </>
  );
}
