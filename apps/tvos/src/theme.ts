// Shared visual tokens for the tvOS UI. Sizes are tuned for a 1080p/4K TV
// viewed from across a room, so type and touch targets are deliberately large.
export const theme = {
  color: {
    background: '#0b1220',
    panel: '#111c2e',
    panelBorder: '#1f2f47',
    focusBorder: '#f59e0b',
    selected: '#1d2f4d',
    text: '#e5edf7',
    textMuted: '#8aa0bd',
    accent: '#2563eb',
    receiver: '#18c964',
    stale: '#64748b',
    error: '#f87171',
  },
  space: {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 48,
  },
  font: {
    title: 44,
    heading: 30,
    body: 24,
    small: 20,
    mono: 22,
  },
  radius: 14,
} as const;
