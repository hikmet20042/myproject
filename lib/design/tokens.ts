export const designTokens = {
  color: {
    brandPrimary: '#2563eb',
    brandSecondary: '#0ea5e9',
    brandAccent: '#22c55e',
    textPrimary: '#111111',
    textMuted: '#64748b',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    section: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 9999,
  },
  shadow: {
    sm: '0 2px 8px rgba(15, 23, 42, 0.06)',
    md: '0 8px 20px rgba(15, 23, 42, 0.08)',
    lg: '0 18px 40px rgba(15, 23, 42, 0.12)',
  },
  cssVar: {
    spacing: {
      xs: 'var(--space-8)',
      sm: 'var(--space-12)',
      md: 'var(--space-16)',
      lg: 'var(--space-24)',
      xl: 'var(--space-32)',
      section: 'var(--space-48)',
    },
    radius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      pill: '9999px',
    },
    shadow: {
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
    color: {
      surfaceMuted: 'var(--background)',
      surface: '#ffffff',
      textPrimary: 'var(--foreground)',
      border: 'var(--border-color, #e2e8f0)',
      brandPrimary: 'var(--primary-color)',
      brandAccent: 'var(--accent-color)',
    },
  },
} as const

export type DesignTokens = typeof designTokens
