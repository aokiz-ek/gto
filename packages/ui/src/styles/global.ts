import { theme } from './theme';

export const globalStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    background-color: ${theme.colors.background};
    color: ${theme.colors.text};
    line-height: ${theme.typography.lineHeight.normal};
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Scrollbar styling - thin and minimal */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.surfaceBorder};
    border-radius: ${theme.borders.radius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.textMuted};
  }

  /* Firefox scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${theme.colors.surfaceBorder} transparent;
  }

  /* Selection */
  ::selection {
    background: ${theme.colors.primaryMuted};
    color: ${theme.colors.text};
  }

  /* Focus styles */
  :focus {
    outline: none;
  }

  :focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }

  /* Links */
  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    transition: color ${theme.transitions.fast};
  }

  a:hover {
    color: ${theme.colors.primaryHover};
  }

  /* Code */
  code, pre {
    font-family: ${theme.typography.fontFamilyMono};
  }

  /* Button reset */
  button {
    font-family: inherit;
    border: none;
    background: none;
    cursor: pointer;
  }

  /* Input reset */
  input, textarea, select {
    font-family: inherit;
    border: none;
    background: none;
  }

  /* List reset */
  ul, ol {
    list-style: none;
  }

  /* Image reset */
  img {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Table reset */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }
`;
