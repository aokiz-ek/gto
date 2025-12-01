import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsive, responsive, BREAKPOINTS } from './useResponsive';

describe('useResponsive', () => {
  const originalInnerWidth = window.innerWidth;

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('should detect mobile screen size', () => {
    setWindowWidth(400);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.screenSize).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isMobileOrTablet).toBe(true);
  });

  it('should detect tablet screen size', () => {
    setWindowWidth(800);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.screenSize).toBe('tablet');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.isMobileOrTablet).toBe(true);
  });

  it('should detect desktop screen size', () => {
    setWindowWidth(1200);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.screenSize).toBe('desktop');
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobileOrTablet).toBe(false);
  });

  it('should update on window resize', () => {
    setWindowWidth(1200);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.isDesktop).toBe(true);

    act(() => {
      setWindowWidth(400);
    });

    expect(result.current.isMobile).toBe(true);
  });

  it('should return correct window width', () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useResponsive());

    expect(result.current.windowWidth).toBe(1024);
  });

  it('should handle edge cases at breakpoints', () => {
    // At mobile breakpoint
    setWindowWidth(BREAKPOINTS.mobile);
    const { result: resultMobile } = renderHook(() => useResponsive());
    expect(resultMobile.current.isMobile).toBe(true);

    // At tablet breakpoint
    setWindowWidth(BREAKPOINTS.tablet);
    const { result: resultTablet } = renderHook(() => useResponsive());
    expect(resultTablet.current.isTablet).toBe(true);

    // At desktop breakpoint
    setWindowWidth(BREAKPOINTS.desktop);
    const { result: resultDesktop } = renderHook(() => useResponsive());
    expect(resultDesktop.current.isDesktop).toBe(true);
  });
});

describe('responsive helper function', () => {
  it('should return mobile value on mobile', () => {
    const result = responsive(
      { mobile: 'sm', tablet: 'md', desktop: 'lg' },
      'mobile'
    );
    expect(result).toBe('sm');
  });

  it('should return tablet value on tablet', () => {
    const result = responsive(
      { mobile: 'sm', tablet: 'md', desktop: 'lg' },
      'tablet'
    );
    expect(result).toBe('md');
  });

  it('should return desktop value on desktop', () => {
    const result = responsive(
      { mobile: 'sm', tablet: 'md', desktop: 'lg' },
      'desktop'
    );
    expect(result).toBe('lg');
  });

  it('should fallback to tablet on mobile if mobile not defined', () => {
    const result = responsive(
      { tablet: 'md', desktop: 'lg' },
      'mobile'
    );
    expect(result).toBe('md');
  });

  it('should fallback to desktop if no mobile/tablet defined', () => {
    const result = responsive(
      { desktop: 'lg' },
      'mobile'
    );
    expect(result).toBe('lg');
  });

  it('should work with numbers', () => {
    const result = responsive(
      { mobile: 16, tablet: 20, desktop: 24 },
      'tablet'
    );
    expect(result).toBe(20);
  });

  it('should work with objects', () => {
    const result = responsive(
      {
        mobile: { padding: '8px' },
        tablet: { padding: '16px' },
        desktop: { padding: '24px' },
      },
      'desktop'
    );
    expect(result).toEqual({ padding: '24px' });
  });
});

describe('BREAKPOINTS', () => {
  it('should have correct values', () => {
    expect(BREAKPOINTS.mobile).toBe(639);
    expect(BREAKPOINTS.tablet).toBe(1023);
    expect(BREAKPOINTS.desktop).toBe(1024);
  });

  it('should have mobile < tablet < desktop', () => {
    expect(BREAKPOINTS.mobile).toBeLessThan(BREAKPOINTS.tablet);
    expect(BREAKPOINTS.tablet).toBeLessThan(BREAKPOINTS.desktop);
  });
});
