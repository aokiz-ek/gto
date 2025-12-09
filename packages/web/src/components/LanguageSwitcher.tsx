'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { useLocale, type Locale } from '@/i18n';

interface LanguageSwitcherProps {
  variant?: 'icon' | 'text' | 'full';
  size?: 'sm' | 'md';
}

export const LanguageSwitcher = memo(function LanguageSwitcher({
  variant = 'icon',
  size = 'md',
}: LanguageSwitcherProps) {
  const { locale, setLocale, locales } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  }, [setLocale]);

  const currentLocale = useMemo(
    () => locales.find(l => l.code === locale),
    [locales, locale]
  );

  const buttonSize = size === 'sm' ? '32px' : '36px';
  const fontSize = size === 'sm' ? '13px' : '14px';
  const iconSize = size === 'sm' ? '16' : '18';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          height: buttonSize,
          minWidth: variant === 'icon' ? buttonSize : 'auto',
          padding: variant === 'icon' ? '0' : '0 12px',
          background: isOpen ? '#242424' : isHovered ? 'rgba(34, 211, 191, 0.1)' : 'transparent',
          border: `1px solid ${isOpen || isHovered ? '#22d3bf' : '#333333'}`,
          borderRadius: '6px',
          color: isOpen || isHovered ? '#22d3bf' : '#b3b3b3',
          fontSize,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        {/* Globe Icon */}
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>

        {/* Text label for non-icon variants */}
        {variant !== 'icon' && (
          <span>
            {variant === 'full' ? currentLocale?.nativeName : currentLocale?.code.toUpperCase()}
          </span>
        )}

        {/* Chevron for non-icon variants */}
        {variant !== 'icon' && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            minWidth: '160px',
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            zIndex: 200,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {locales.map((loc) => (
            <LanguageOption
              key={loc.code}
              locale={loc}
              isSelected={loc.code === locale}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

// Language option item
interface LanguageOptionProps {
  locale: { code: Locale; name: string; nativeName: string };
  isSelected: boolean;
  onSelect: (locale: Locale) => void;
}

const LanguageOption = memo(function LanguageOption({
  locale,
  isSelected,
  onSelect,
}: LanguageOptionProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(locale.code)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px 14px',
        background: isSelected
          ? 'rgba(34, 211, 191, 0.15)'
          : isHovered
          ? 'rgba(34, 211, 191, 0.08)'
          : 'transparent',
        border: 'none',
        color: isSelected ? '#22d3bf' : isHovered ? '#ffffff' : '#b3b3b3',
        fontSize: '14px',
        fontWeight: isSelected ? 600 : 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span>{locale.nativeName}</span>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>{locale.name}</span>
      </span>

      {/* Checkmark for selected */}
      {isSelected && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
});
