import React from 'react';
import { theme } from '../styles/theme';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: '400px',
    md: '500px',
    lg: '640px',
    xl: '800px',
  };

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.md,
  };

  const contentStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: sizes[size],
    maxHeight: '90vh',
    background: theme.colors.surface,
    borderRadius: theme.borders.radius.xl,
    border: `1px solid ${theme.colors.surfaceLight}`,
    boxShadow: theme.shadows.lg,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.surfaceLight}`,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  };

  const closeButtonStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: theme.borders.radius.md,
    color: theme.colors.textMuted,
    cursor: 'pointer',
    fontSize: '20px',
    transition: `all ${theme.transitions.fast}`,
  };

  const bodyStyles: React.CSSProperties = {
    padding: theme.spacing.md,
    overflowY: 'auto',
    flex: 1,
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={contentStyles} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div style={headerStyles}>
            <h2 style={titleStyles}>{title}</h2>
            <button style={closeButtonStyles} onClick={onClose}>
              &times;
            </button>
          </div>
        )}
        <div style={bodyStyles}>{children}</div>
      </div>
    </div>
  );
};
