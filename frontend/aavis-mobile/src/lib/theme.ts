export const getThemeColors = (theme: 'dark' | 'light') => {
  const isDark = theme === 'dark';
  return {
    isDark,
    background: isDark ? '#080914' : '#f5f6fa',
    card: isDark ? '#111324' : '#ffffff',
    border: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
    borderActive: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    brandPrimary: '#8b5cf6',
    brandSecondary: '#14b8a6',
    brandSafe: '#10b981',
    brandCaution: '#f59e0b',
    brandHazardous: '#ef4444',
  };
};

export type ThemeColors = ReturnType<typeof getThemeColors>;
