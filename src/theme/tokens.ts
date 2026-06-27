export const colors = {
  bg: {
    app: '#FBF5EA',
    gradientTop: '#FCF7EE',
    gradientBottom: '#F3E7D2',
  },
  surface: {
    card: '#FFFDF9',
    raised: '#FDF1E7',
    sunken: '#F0E6D5',
  },
  overlay: 'rgba(46,38,32,0.55)',
  terracotta: {
    DEFAULT: '#C75D3A',
    dark: '#A84A2C',
    light: '#E68A5C',
    tint: '#F7E0D3',
  },
  olive: {
    DEFAULT: '#7C8B3D',
    dark: '#5F6C2C',
    light: '#A0AE63',
    tint: '#EBEEDA',
  },
  blue: {
    DEFAULT: '#2A7DB1',
    dark: '#1B5C84',
    light: '#6FB0D8',
    tint: '#DCEDF6',
  },
  coin: {
    DEFAULT: '#F2B937',
    dark: '#C8941F',
    light: '#FFD56B',
    tint: '#FFF4D6',
  },
  gem: {
    DEFAULT: '#1FB59A',
    dark: '#138472',
    light: '#5FD8C2',
    tint: '#D7F3EC',
  },
  success: '#5BA150',
  danger: '#C0492F',
  warning: '#E89B2C',
  rarity: {
    common: '#9B9384',
    rare: '#2A7DB1',
    epic: '#8B4FC0',
    legendary: '#E8A317',
  },
  text: {
    primary: '#2E2620',
    secondary: '#6E6256',
    tertiary: '#A89C8C',
    onColor: '#FFF9F0',
    onCoin: '#5A3D12',
  },
  border: {
    subtle: '#EBDFCD',
    strong: '#D9C9B0',
  },
};

export const typography = {
  display: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: 'Baloo2_700Bold', fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: 'Baloo2_700Bold', fontSize: 20, lineHeight: 26 },
  num: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22 },
  bodyL: { fontFamily: 'Nunito_700Bold', fontSize: 16, lineHeight: 22 },
  body: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20 },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.5 },
  caption: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  micro: { fontFamily: 'Nunito_700Bold', fontSize: 10 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const shadows = {
  e1: {
    shadowColor: '#3A2A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  e2: {
    shadowColor: '#3A2A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },
  e3: {
    shadowColor: '#3A2A1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
