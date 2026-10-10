/**
 * CamneX Design Tokens & Theme Constants
 * Shared across Public Storefront, Website Manager (/admin), and Staff App (/staff)
 */

export const tokens = {
  colors: {
    primary: '#F15A24',
    primaryHover: '#D94D1C',
    primarySubtle: '#FFF5F0',
    primaryBorder: 'rgba(241, 90, 36, 0.25)',

    navy: '#0F172A',
    navyDeep: '#090D16',
    navyCard: '#1E293B',

    canvas: '#FAF7F2',
    canvasCard: '#FFFFFF',
    canvasMuted: '#F4EEE6',
    canvasAlt: '#F8F6F0',

    border: '#EDE8E1',
    borderMuted: '#E2DCD5',
    borderDark: '#334155',

    text: {
      primary: '#111827',
      secondary: '#5B6472',
      muted: '#8A94A6',
      inverted: '#FFFFFF',
      invertedMuted: '#94A3B8'
    },

    status: {
      success: '#10B981',
      successSubtle: '#ECFDF5',
      warning: '#F59E0B',
      warningSubtle: '#FFFBEB',
      danger: '#EF4444',
      dangerSubtle: '#FEF2F2',
      info: '#3B82F6',
      infoSubtle: '#EFF6FF'
    }
  },

  fonts: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Plus Jakarta Sans, Inter, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  },

  radii: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    popover: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
  }
} as const;

export type ThemeTokens = typeof tokens;

