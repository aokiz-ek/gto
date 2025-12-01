'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@gto/ui';
import { useResponsive } from '@/hooks';
import { CampaignBanner } from '@/components';

// Banner ad data
const bannerAds = [
  {
    id: 1,
    title: 'Premium Membership',
    subtitle: 'Get unlimited access to all GTO solutions',
    description: 'Unlock 10,000+ preflop and postflop solutions with our Premium plan',
    cta: 'Upgrade Now',
    href: '/pricing',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accentColor: '#f59e0b',
  },
  {
    id: 2,
    title: 'New: Postflop Trainer',
    subtitle: 'Master every street with AI-powered drills',
    description: 'Practice flop, turn, and river decisions with instant GTO feedback',
    cta: 'Try Free',
    href: '/practice',
    bgGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
    accentColor: '#22d3bf',
  },
  {
    id: 3,
    title: 'Tournament Special',
    subtitle: 'MTT & SNG solutions now available',
    description: 'Study ICM-adjusted ranges for every stack depth and bubble situation',
    cta: 'Explore',
    href: '/solutions',
    bgGradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1e3a5f 100%)',
    accentColor: '#8b5cf6',
  },
];

// Interactive CTA Button for Banner
function BannerCTAButton({ href, cta, accentColor }: { href: string; cta: string; accentColor: string }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <Link href={href}>
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          padding: isMobile ? '12px 24px' : '14px 32px',
          background: isPressed ? accentColor : isHovered ? accentColor : accentColor,
          border: 'none',
          borderRadius: '10px',
          color: '#000000',
          fontSize: isMobile ? '14px' : '15px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0)',
          boxShadow: isHovered ? `0 8px 24px ${accentColor}50` : `0 4px 12px ${accentColor}30`,
          transition: 'all 0.2s ease',
        }}
      >
        {cta}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </Link>
  );
}

// Interactive Arrow Button
function ArrowButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        position: 'absolute',
        [direction === 'left' ? 'left' : 'right']: '20px',
        top: '50%',
        transform: `translateY(-50%) ${isPressed ? 'scale(0.9)' : isHovered ? 'scale(1.1)' : 'scale(1)'}`,
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: isHovered ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)'}`,
        color: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{
          transform: isHovered ? (direction === 'left' ? 'translateX(-2px)' : 'translateX(2px)') : 'translateX(0)',
          transition: 'transform 0.2s ease',
        }}
      >
        <path d={direction === 'left' ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
      </svg>
    </button>
  );
}

// Interactive Dot Indicator
function DotIndicator({ index, currentIndex, accentColor, onClick }: {
  index: number;
  currentIndex: number;
  accentColor: string;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = index === currentIndex;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: isActive ? '24px' : isHovered ? '16px' : '8px',
        height: '8px',
        borderRadius: '4px',
        background: isActive ? accentColor : isHovered ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered && !isActive ? 'scale(1.2)' : 'scale(1)',
      }}
    />
  );
}

// Banner Carousel Component
function BannerCarousel() {
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToNext = useCallback(() => {
    goToSlide((currentIndex + 1) % bannerAds.length);
  }, [currentIndex, goToSlide]);

  const goToPrev = useCallback(() => {
    goToSlide((currentIndex - 1 + bannerAds.length) % bannerAds.length);
  }, [currentIndex, goToSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(goToNext, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, goToNext]);

  const handleMouseEnter = () => !isMobileOrTablet && setIsAutoPlaying(false);
  const handleMouseLeave = () => !isMobileOrTablet && setIsAutoPlaying(true);

  const currentAd = bannerAds[currentIndex];
  const bannerHeight = isMobile ? '320px' : isTablet ? '360px' : '420px';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: bannerHeight,
        overflow: 'hidden',
        background: '#0d0d0d',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          display: 'flex',
          width: `${bannerAds.length * 100}%`,
          height: '100%',
          transform: `translateX(-${currentIndex * (100 / bannerAds.length)}%)`,
          transition: 'transform 0.5s ease-in-out',
        }}
      >
        {bannerAds.map((ad) => (
          <div
            key={ad.id}
            style={{
              width: `${100 / bannerAds.length}%`,
              height: '100%',
              background: ad.bgGradient,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: isMobile ? '300px' : '500px',
              height: isMobile ? '300px' : '500px',
              background: `radial-gradient(circle, ${ad.accentColor}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Content */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              maxWidth: '1200px',
              margin: '0 auto',
              padding: isMobile ? '24px 16px' : isTablet ? '40px 24px' : '60px 48px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ maxWidth: isMobile ? '100%' : '550px', flex: 1 }}>
                {/* Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 10px' : '8px 16px',
                  background: `${ad.accentColor}20`,
                  border: `1px solid ${ad.accentColor}40`,
                  borderRadius: '100px',
                  marginBottom: isMobile ? '16px' : '24px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: ad.accentColor,
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{
                    fontSize: isMobile ? '11px' : '13px',
                    fontWeight: 600,
                    color: ad.accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {ad.subtitle}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: isMobile ? '28px' : isTablet ? '36px' : '48px',
                  fontWeight: 800,
                  color: '#ffffff',
                  marginBottom: isMobile ? '12px' : '16px',
                  lineHeight: 1.1,
                  letterSpacing: '-1px',
                }}>
                  {ad.title}
                </h2>

                {/* Description */}
                <p style={{
                  fontSize: isMobile ? '14px' : '18px',
                  color: '#b3b3b3',
                  marginBottom: isMobile ? '20px' : '32px',
                  lineHeight: 1.6,
                  display: isMobile ? '-webkit-box' : 'block',
                  WebkitLineClamp: isMobile ? 2 : undefined,
                  WebkitBoxOrient: isMobile ? 'vertical' : undefined,
                  overflow: isMobile ? 'hidden' : undefined,
                }}>
                  {ad.description}
                </p>

                {/* CTA Button */}
                <BannerCTAButton href={ad.href} cta={ad.cta} accentColor={ad.accentColor} />
              </div>

              {/* Right side decorative - hide on mobile */}
              {!isMobile && (
                <div style={{
                  width: isTablet ? '280px' : '420px',
                  height: isTablet ? '200px' : '300px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'relative',
                    width: isTablet ? '200px' : '280px',
                    height: isTablet ? '160px' : '220px',
                  }}>
                    {[2, 1, 0].map((offset) => (
                      <div
                        key={offset}
                        style={{
                          position: 'absolute',
                          top: offset * (isTablet ? 8 : 12),
                          left: offset * (isTablet ? 8 : 12),
                          width: isTablet ? '160px' : '220px',
                          height: isTablet ? '120px' : '160px',
                          background: offset === 0 ? '#1a1a1a' : `rgba(26, 26, 26, ${0.6 - offset * 0.15})`,
                          borderRadius: '16px',
                          border: `1px solid ${offset === 0 ? ad.accentColor : '#333333'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: offset === 0 ? `0 16px 40px ${ad.accentColor}25` : 'none',
                        }}
                      >
                        {offset === 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${isTablet ? 5 : 7}, 1fr)`,
                            gap: isTablet ? '3px' : '4px',
                            padding: '12px',
                          }}>
                            {Array.from({ length: isTablet ? 25 : 49 }).map((_, i) => {
                              const gridSize = isTablet ? 5 : 7;
                              const row = Math.floor(i / gridSize);
                              const col = i % gridSize;
                              const isPair = row === col;
                              const isSuited = col > row;
                              let opacity = 0;
                              if (isPair && row < (isTablet ? 3 : 4)) opacity = 0.9;
                              else if (isSuited && row < (isTablet ? 2 : 3) && col < (isTablet ? 4 : 5)) opacity = 0.7;
                              else if (!isSuited && row < 2 && col < (isTablet ? 3 : 4)) opacity = 0.5;
                              else if (isPair) opacity = 0.3;

                              return (
                                <div
                                  key={i}
                                  style={{
                                    width: isTablet ? '16px' : '20px',
                                    height: isTablet ? '16px' : '20px',
                                    borderRadius: '3px',
                                    background: opacity > 0
                                      ? `${ad.accentColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
                                      : '#2a2a2a',
                                    border: opacity > 0 ? 'none' : '1px solid #333333',
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - hide on mobile */}
      {!isMobile && (
        <>
          <ArrowButton direction="left" onClick={goToPrev} />
          <ArrowButton direction="right" onClick={goToNext} />
        </>
      )}

      {/* Dots Indicator */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? '12px' : '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
      }}>
        {bannerAds.map((_, index) => (
          <DotIndicator
            key={index}
            index={index}
            currentIndex={currentIndex}
            accentColor={currentAd.accentColor}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
      }}>
        <div
          style={{
            height: '100%',
            background: currentAd.accentColor,
            width: isAutoPlaying ? '100%' : '0%',
            transition: isAutoPlaying ? 'width 5s linear' : 'none',
          }}
          key={`${currentIndex}-${isAutoPlaying}`}
        />
      </div>
    </div>
  );
}

// Hook for scroll animation
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Animated section wrapper
function AnimatedSection({
  children,
  delay = 0,
  direction = 'up',
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  style?: React.CSSProperties;
}) {
  const { ref, isVisible } = useScrollAnimation();

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(40px)';
      case 'down': return 'translateY(-40px)';
      case 'left': return 'translateX(40px)';
      case 'right': return 'translateX(-40px)';
      case 'scale': return 'scale(0.95)';
      case 'fade': return 'none';
      default: return 'translateY(40px)';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getInitialTransform(),
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// Interactive Feature Card
function FeatureCard({ feature, index }: {
  feature: { title: string; description: string; icon: React.ReactNode; href: string; color: string };
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <AnimatedSection delay={index * 0.15} direction="up">
      <Link href={feature.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          style={{
            padding: isMobile ? '24px' : '32px',
            background: isHovered ? '#242424' : '#1a1a1a',
            border: `1px solid ${isHovered ? feature.color : '#333333'}`,
            borderRadius: '16px',
            height: '100%',
            cursor: 'pointer',
            transform: isPressed ? 'scale(0.98)' : isHovered ? 'translateY(-8px)' : 'translateY(0)',
            boxShadow: isHovered ? `0 20px 40px ${feature.color}20` : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{
            width: isMobile ? '48px' : '64px',
            height: isMobile ? '48px' : '64px',
            borderRadius: '12px',
            background: `${feature.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: isMobile ? '16px' : '24px',
            color: feature.color,
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1)',
            transition: 'transform 0.25s ease',
          }}>
            {feature.icon}
          </div>
          <h3 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '8px',
          }}>
            {feature.title}
          </h3>
          <p style={{
            fontSize: isMobile ? '14px' : '15px',
            color: isHovered ? '#ffffff' : '#b3b3b3',
            lineHeight: 1.6,
            transition: 'color 0.2s ease',
          }}>
            {feature.description}
          </p>
          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: feature.color,
            fontSize: '14px',
            fontWeight: 500,
          }}>
            Learn more
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
              }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </AnimatedSection>
  );
}

// Interactive Stat Card
function StatCard({ stat, index }: { stat: { value: string; label: string }; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <AnimatedSection delay={index * 0.1} direction="up">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          textAlign: 'center',
          padding: '16px',
          borderRadius: '12px',
          background: isHovered ? 'rgba(34, 211, 191, 0.05)' : 'transparent',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s ease',
          cursor: 'default',
        }}
      >
        <div style={{
          fontSize: isMobile ? '28px' : '40px',
          fontWeight: 700,
          color: '#22d3bf',
          marginBottom: '4px',
          fontFamily: "'SF Mono', monospace",
          textShadow: isHovered ? '0 0 20px rgba(34, 211, 191, 0.5)' : 'none',
          transition: 'text-shadow 0.2s ease',
        }}>
          <AnimatedCounter value={stat.value} duration={1500} />
        </div>
        <div style={{
          fontSize: isMobile ? '12px' : '14px',
          color: isHovered ? '#ffffff' : '#666666',
          fontWeight: 500,
          transition: 'color 0.2s ease',
        }}>
          {stat.label}
        </div>
      </div>
    </AnimatedSection>
  );
}

// Interactive Check List Item
function CheckListItem({ item, index, isMobileOrTablet }: { item: string; index: number; isMobileOrTablet: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedSection delay={0.1 + index * 0.1} direction={isMobileOrTablet ? 'up' : 'right'}>
      <li
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: isMobileOrTablet ? '14px' : '15px',
          color: isHovered ? '#22d3bf' : '#ffffff',
          justifyContent: isMobileOrTablet ? 'center' : 'flex-start',
          padding: '8px 12px',
          borderRadius: '8px',
          background: isHovered ? 'rgba(34, 211, 191, 0.05)' : 'transparent',
          transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
          transition: 'all 0.2s ease',
          cursor: 'default',
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: isHovered ? '#22d3bf30' : '#22d3bf20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'all 0.2s ease',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3bf" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {item}
      </li>
    </AnimatedSection>
  );
}

// Interactive Footer Link
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        fontSize: '14px',
        color: isHovered ? '#22d3bf' : '#666666',
        textDecoration: 'none',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        display: 'inline-block',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
    </Link>
  );
}

// Interactive Hero CTA Button
function HeroCTAButton({ href, variant, children }: {
  href: string;
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { isMobile } = useResponsive();

  const isPrimary = variant === 'primary';

  return (
    <Link href={href} style={{ width: isMobile ? '100%' : 'auto' }}>
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          width: isMobile ? '100%' : 'auto',
          padding: isMobile ? '14px 24px' : '16px 32px',
          background: isPrimary
            ? (isPressed ? '#14b8a6' : isHovered ? '#1dd4c0' : '#22d3bf')
            : (isHovered ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
          border: isPrimary ? 'none' : `1px solid ${isHovered ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)'}`,
          borderRadius: '10px',
          color: isPrimary ? '#000000' : (isHovered ? '#ffffff' : '#3b82f6'),
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transform: isPressed ? 'scale(0.96)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isPrimary && isHovered ? '0 8px 24px rgba(34, 211, 191, 0.4)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {children}
      </button>
    </Link>
  );
}

// Feature data
const features = [
  {
    title: 'Daily Challenge',
    description: '每日10题挑战，与全球玩家一起竞争，追踪你的进步。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    href: '/challenge',
    color: '#f59e0b',
  },
  {
    title: 'Practice Mode',
    description: 'Train your GTO skills with interactive drills and instant feedback.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    href: '/practice',
    color: '#8b5cf6',
  },
  {
    title: 'Solutions Library',
    description: 'Access thousands of precomputed GTO solutions for every spot.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    href: '/solutions',
    color: '#22d3bf',
  },
  {
    title: 'Hand Analyzer',
    description: 'Analyze any hand situation in real-time with GTO recommendations.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    href: '/analyzer',
    color: '#3b82f6',
  },
  {
    title: 'GTO Courses',
    description: '系统学习GTO策略，从入门到精通的完整课程体系。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    ),
    href: '/courses',
    color: '#ec4899',
  },
  {
    title: 'Postflop Strategy',
    description: '翻牌后场景库，掌握C-bet、价值下注和诈唬策略。',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M12 22V12" />
        <path d="M20 12v5c0 2-4 4-8 4s-8-2-8-4v-5" />
      </svg>
    ),
    href: '/postflop',
    color: '#10b981',
  },
];

// Stats data
const stats = [
  { value: '50K+', label: 'Active Users' },
  { value: '10M+', label: 'Hands Analyzed' },
  { value: '500K+', label: 'Practice Sessions' },
  { value: '99.9%', label: 'GTO Accuracy' },
];

// Animated counter component
function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState('0');
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    if (!isVisible) return;

    const numericPart = value.replace(/[^0-9.]/g, '');
    const suffix = value.replace(/[0-9.]/g, '');
    const targetNum = parseFloat(numericPart);

    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = targetNum * easeOut;

      if (targetNum >= 1000) setDisplayValue(Math.floor(current / 1000) + 'K' + suffix);
      else if (targetNum >= 100) setDisplayValue(Math.floor(current) + suffix);
      else setDisplayValue(current.toFixed(1) + suffix);

      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(value);
    };

    animate();
  }, [isVisible, value, duration]);

  return <span ref={ref}>{displayValue}</span>;
}

// Range Matrix Preview
function RangeMatrixPreview({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { ref, isVisible } = useScrollAnimation();
  const [cells, setCells] = useState<number[]>([]);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const gridSize = size === 'sm' ? 9 : 13;
  const cellSize = size === 'sm' ? '18px' : '22px';
  const containerWidth = size === 'sm' ? `${9 * 20}px` : '312px';

  useEffect(() => {
    if (!isVisible) return;
    const totalCells = gridSize * gridSize;
    let currentCell = 0;

    const interval = setInterval(() => {
      if (currentCell < totalCells) {
        setCells(prev => [...prev, currentCell]);
        currentCell++;
      } else {
        clearInterval(interval);
      }
    }, 8);

    return () => clearInterval(interval);
  }, [isVisible, gridSize]);

  const getCellOpacity = (i: number) => {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const isPair = row === col;
    const isSuited = col > row;

    if (isPair && row < Math.floor(gridSize * 0.45)) return 0.9;
    if (isSuited && row < Math.floor(gridSize * 0.3) && col < Math.floor(gridSize * 0.6)) return 0.7;
    if (!isSuited && row < Math.floor(gridSize * 0.25) && col < Math.floor(gridSize * 0.4)) return 0.5;
    if (isPair) return 0.4;
    return 0;
  };

  return (
    <div
      ref={ref}
      style={{
        padding: size === 'sm' ? '16px' : '24px',
        background: '#0d0d0d',
        borderRadius: '16px',
        border: '1px solid #333333',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: '2px',
        width: containerWidth,
      }}>
        {Array.from({ length: gridSize * gridSize }).map((_, i) => {
          const opacity = getCellOpacity(i);
          const isAnimated = cells.includes(i);
          const isHovered = hoveredCell === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredCell(i)}
              onMouseLeave={() => setHoveredCell(null)}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: '3px',
                background: opacity > 0
                  ? `rgba(34, 211, 191, ${isAnimated ? (isHovered ? Math.min(opacity + 0.2, 1) : opacity) : 0})`
                  : isHovered ? '#2a2a2a' : '#1a1a1a',
                border: opacity > 0 ? 'none' : `1px solid ${isHovered ? '#444' : '#333333'}`,
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const { isMobile, isTablet, isMobileOrTablet } = useResponsive();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setHeroVisible(true);
  }, []);

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#0d0d0d',
      overflowX: 'hidden',
    }}>
      {/* Campaign Banner - 活动横幅 */}
      <CampaignBanner />

      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Hero Section */}
      <section style={{
        padding: isMobile ? '48px 16px 60px' : isTablet ? '60px 24px 80px' : '80px 24px 100px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '400px' : '800px',
          height: isMobile ? '300px' : '600px',
          background: 'radial-gradient(ellipse at center, rgba(34, 211, 191, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          opacity: heroVisible ? 1 : 0,
          transition: 'opacity 1s ease 0.3s',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '6px 12px' : '8px 16px',
            background: 'rgba(34, 211, 191, 0.1)',
            border: '1px solid rgba(34, 211, 191, 0.2)',
            borderRadius: '100px',
            marginBottom: isMobile ? '20px' : '32px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22d3bf',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#22d3bf', fontWeight: 500 }}>
              Powered by Advanced GTO Algorithms
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: isMobile ? '36px' : isTablet ? '48px' : '64px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: isMobile ? '16px' : '24px',
            letterSpacing: '-2px',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          }}>
            Crush Your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #22d3bf 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Competition
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: isMobile ? '16px' : '20px',
            color: '#b3b3b3',
            maxWidth: '600px',
            margin: '0 auto',
            marginBottom: isMobile ? '28px' : '40px',
            lineHeight: 1.6,
            padding: isMobile ? '0 8px' : 0,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
          }}>
            The best way to learn and practice Game Theory Optimal poker.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '16px',
            justifyContent: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            padding: isMobile ? '0 16px' : 0,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s',
          }}>
            <HeroCTAButton href="/solutions" variant="primary">
              Get Solutions for Free
            </HeroCTAButton>
            <HeroCTAButton href="/practice" variant="secondary">
              Start Practicing
            </HeroCTAButton>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: isMobile ? '32px 16px' : '40px 24px',
        borderTop: '1px solid #333333',
        borderBottom: '1px solid #333333',
        background: '#0d0d0d',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '24px 16px' : '32px',
        }}>
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: isMobile ? '48px 16px' : isTablet ? '64px 24px' : '100px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <AnimatedSection direction="up">
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '64px' }}>
            <h2 style={{
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '40px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '12px',
            }}>
              Everything You Need to Master GTO
            </h2>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: '#666666',
              maxWidth: '600px',
              margin: '0 auto',
              padding: isMobile ? '0 8px' : 0,
            }}>
              Comprehensive tools designed to help you understand and apply game theory optimal strategies.
            </p>
          </div>
        </AnimatedSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '16px' : '20px',
        }}>
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </section>

      {/* Range Preview Section */}
      <section style={{
        padding: isMobile ? '48px 16px' : '80px 24px',
        background: '#1a1a1a',
        borderTop: '1px solid #333333',
        borderBottom: '1px solid #333333',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobileOrTablet ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '32px' : '64px',
        }}>
          <AnimatedSection direction={isMobileOrTablet ? 'up' : 'right'} style={{ flex: 1 }}>
            <h2 style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '16px',
              textAlign: isMobileOrTablet ? 'center' : 'left',
            }}>
              Visualize Optimal Ranges
            </h2>
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              color: '#b3b3b3',
              lineHeight: 1.7,
              marginBottom: '24px',
              textAlign: isMobileOrTablet ? 'center' : 'left',
            }}>
              Our interactive range matrix makes it easy to study GTO preflop strategies.
            </p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {[
                'All positions from UTG to BB',
                'Cash games, MTT, and SNG formats',
                'Stack depths from 20bb to 100bb+',
                'RFI, 3-bet, and vs 3-bet scenarios',
              ].map((item, i) => (
                <CheckListItem key={i} item={item} index={i} isMobileOrTablet={isMobileOrTablet} />
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection
            direction={isMobileOrTablet ? 'up' : 'left'}
            delay={0.2}
            style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
          >
            <RangeMatrixPreview size={isMobile ? 'sm' : 'md'} />
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: isMobile ? '48px 16px' : '100px 24px',
        textAlign: 'center',
        background: '#0d0d0d',
      }}>
        <AnimatedSection direction="scale">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: isMobile ? '28px' : '40px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '16px',
            }}>
              Ready to Play Like a Pro?
            </h2>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: '#666666',
              marginBottom: isMobile ? '28px' : '40px',
              padding: isMobile ? '0 8px' : 0,
            }}>
              Join thousands of players improving their game with Aokiz GTO.
            </p>
            <HeroCTAButton href="/auth/register" variant="primary">
              Get Started for Free
            </HeroCTAButton>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <AnimatedSection direction="fade">
        <footer style={{
          padding: isMobile ? '32px 16px' : '40px 24px',
          borderTop: '1px solid #333333',
          background: '#0d0d0d',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: isMobile ? '24px' : '16px',
          }}>
            <FooterLogo />

            <div style={{
              display: 'flex',
              gap: isMobile ? '20px' : '32px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <FooterLink href="/terms">Terms</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </div>

            <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#666666' }}>
              &copy; 2024 Aokiz GTO
            </div>
          </div>
        </footer>
      </AnimatedSection>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Footer Logo with hover effect
function FooterLogo() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: 'linear-gradient(135deg, #22d3bf 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isHovered ? '0 0 15px rgba(34, 211, 191, 0.5)' : 'none',
        transform: isHovered ? 'rotate(5deg)' : 'rotate(0deg)',
        transition: 'all 0.3s ease',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
      </div>
      <span style={{
        fontSize: '16px',
        fontWeight: 600,
        color: isHovered ? '#22d3bf' : '#ffffff',
        transition: 'color 0.2s ease',
      }}>
        Aokiz GTO
      </span>
    </div>
  );
}
