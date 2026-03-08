import type { TextStyle, ViewStyle } from 'react-native';

type FontWeight = NonNullable<TextStyle['fontWeight']>;

export type ColorScale = {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  card: string;
  cardAlt: string;
  border: string;
  borderStrong: string;
  primary: string;
  primarySoft: string;
  accentBlue: string;
  accentSky: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  error: string;
  warning: string;
  black: string;
  white: string;
};

export type TypographyToken = {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeight;
  letterSpacing?: number;
};

export type TypographyScale = {
  fontFamily: string;
  displayFontFamily: string;
  weights: {
    regular: FontWeight;
    medium: FontWeight;
    semibold: FontWeight;
    bold: FontWeight;
  };
  variants: {
    display: TypographyToken;
    h1: TypographyToken;
    h2: TypographyToken;
    title: TypographyToken;
    subtitle: TypographyToken;
    body: TypographyToken;
    bodySmall: TypographyToken;
    caption: TypographyToken;
    button: TypographyToken;
    label: TypographyToken;
  };
};

export type SpacingScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export type RadiusScale = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  pill: number;
};

export type ShadowToken = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export type Theme = {
  colors: ColorScale;
  typography: TypographyScale;
  spacing: SpacingScale;
  radius: RadiusScale;
  shadows: {
    none: ShadowToken;
    subtle: ShadowToken;
    card: ShadowToken;
    raised: ShadowToken;
  };
};

const fontFamily = 'Jost_400Regular';
const displayFontFamily = 'PlayfairDisplay_700Bold';

export const theme: Theme = {
  colors: {
    background: '#EDEBE8',
    surface: '#F4F1ED',
    surfaceMuted: '#E6E1DC',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    cardAlt: '#F7F4F0',
    border: '#E6E1DC',
    borderStrong: '#D8D1CA',
    primary: '#E77449',
    primarySoft: '#F8D6CB',
    accentBlue: '#EBAA7D',
    accentSky: '#F3C6A7',
    text: '#3D3D3D',
    textSecondary: '#625C58',
    textMuted: '#9B948E',
    textInverse: '#FFFFFF',
    success: '#3F964B',
    error: '#D06B4D',
    warning: '#C79844',
    black: '#3D3D3D',
    white: '#FFFFFF',
  },
  typography: {
    fontFamily,
    displayFontFamily,
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    variants: {
      display: {
        fontSize: 48,
        lineHeight: 54,
        fontWeight: '400',
        letterSpacing: -1.2,
      },
      h1: {
        fontSize: 30,
        lineHeight: 36,
        fontWeight: '700',
        letterSpacing: -0.4,
      },
      h2: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      title: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '600',
      },
      subtitle: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '500',
      },
      body: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
      },
      bodySmall: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '400',
      },
      caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
      },
      button: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '600',
        letterSpacing: 0.1,
      },
      label: {
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '500',
        letterSpacing: 0.2,
      },
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 26,
    xl: 34,
    xxl: 42,
    pill: 999,
  },
  shadows: {
    none: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: '#3D3D3D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
      elevation: 3,
    },
    card: {
      shadowColor: '#3D3D3D',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 5,
    },
    raised: {
      shadowColor: '#3D3D3D',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

export type ThemeColorKey = keyof Theme['colors'];
export type TypographyVariant = keyof Theme['typography']['variants'];
export type ShadowVariant = keyof Theme['shadows'];
export type SpacingKey = keyof Theme['spacing'];
export type RadiusKey = keyof Theme['radius'];

export default theme;
