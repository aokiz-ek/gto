import React from 'react';
import { theme } from '../styles/theme';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
  onChange,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.sm,
    width: '100%',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textSecondary,
  };

  const valueStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamilyMono,
  };

  const trackStyles: React.CSSProperties = {
    position: 'relative',
    height: '8px',
    background: theme.colors.surface,
    borderRadius: theme.borders.radius.full,
    overflow: 'hidden',
  };

  const fillStyles: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${percentage}%`,
    background: theme.gradients.primary,
    borderRadius: theme.borders.radius.full,
    transition: `width ${theme.transitions.fast}`,
  };

  const inputStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  };

  return (
    <div style={containerStyles}>
      {(label || showValue) && (
        <div style={headerStyles}>
          {label && <span style={labelStyles}>{label}</span>}
          {showValue && <span style={valueStyles}>{formatValue(value)}</span>}
        </div>
      )}
      <div style={trackStyles}>
        <div style={fillStyles} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyles}
        />
      </div>
    </div>
  );
};
