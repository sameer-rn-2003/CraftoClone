// src/utils/constants.js
// Central design tokens and app-wide constants

export const COLORS = {
    primary: '#7C6FFF',
    primaryDark: '#5A4FD6',
    primaryLight: '#9B91FF',
    secondary: '#FF6584',
    secondaryDark: '#E04567',
    accent: '#43E97B',
    background: '#080814',
    backgroundCard: '#0D0D1F',
    surface: '#13132B',
    surfaceElevated: '#1A1A36',
    card: '#1E1E3A',
    cardHover: '#252548',
    text: '#FFFFFF',
    textSecondary: '#B0B0D0',
    textMuted: '#5A5A85',
    border: '#252545',
    borderLight: '#30305A',
    success: '#43E97B',
    warning: '#F6D365',
    error: '#FF6B6B',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Glass effect
    glass: 'rgba(255,255,255,0.04)',
    glassBorder: 'rgba(255,255,255,0.08)',
    glassDark: 'rgba(0,0,0,0.35)',

    // Category colors
    political: '#FF6B6B',
    festival: '#F7971E',
    birthday: '#FF6584',
    business: '#7C6FFF',

    // Gradient pairs (for use with LinearGradient or manual fallback)
    gradients: {
        primary: ['#7C6FFF', '#5A4FD6'],
        hero: ['#0D0B2E', '#080814'],
        political: ['#FF416C', '#FF4B2B'],
        festival: ['#F7971E', '#FFD200'],
        birthday: ['#FF6584', '#FF8E53'],
        business: ['#7C6FFF', '#2F80ED'],
        dark: ['#0D0D1F', '#080814'],
        accent: ['#43E97B', '#38C86A'],
    },
};

export const FONTS = {
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        base: 16,
        lg: 18,
        xl: 22,
        xxl: 28,
        xxxl: 36,
        huge: 48,
    },
    weights: {
        thin: '100',
        light: '300',
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700',
        extraBold: '800',
        black: '900',
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1.0,
        widest: 2.0,
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const BORDER_RADIUS = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 999,
};

export const SHADOW = {
    small: {
        shadowColor: '#7C6FFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    medium: {
        shadowColor: '#7C6FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 12,
        elevation: 8,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        elevation: 14,
    },
    glow: {
        shadowColor: '#7C6FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
    },
    coloredGlow: (color) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
    }),
};

export const CATEGORIES = [
    {
        id: 'political',
        label: 'Political',
        icon: '🏛️',
        color: COLORS.political,
        gradient: ['#FF416C', '#FF4B2B'],
    },
    {
        id: 'festival',
        label: 'Festival',
        icon: '🎉',
        color: COLORS.festival,
        gradient: ['#F7971E', '#FFD200'],
    },
    {
        id: 'birthday',
        label: 'Birthday',
        icon: '🎂',
        color: COLORS.birthday,
        gradient: ['#FF6584', '#FF8E53'],
    },
    {
        id: 'business',
        label: 'Business',
        icon: '💼',
        color: COLORS.business,
        gradient: ['#7C6FFF', '#2F80ED'],
    },
];

export const POSTER_SIZE = {
    width: 400,
    height: 560,
};

export const SCREEN_PADDING = SPACING.base;
