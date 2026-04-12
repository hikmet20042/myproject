export const designTokens = {
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
  color: {
    brandPrimary: '#2563eb',
    brandSecondary: '#0ea5e9',
    brandAccent: '#22c55e',
    textPrimary: '#111111',
    textMuted: '#64748b',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    border: '#e2e8f0',
  },
} as const

export type DesignTokens = typeof designTokens
