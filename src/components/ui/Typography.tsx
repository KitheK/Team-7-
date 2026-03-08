import React from 'react';
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native';
import theme, {
  type ThemeColorKey,
  type TypographyVariant,
} from '../../../constants/theme';

type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'error' | 'warning';
type TextAlign = 'auto' | 'left' | 'center' | 'right' | 'justify';

export type TypographyProps = TextProps & {
  children: React.ReactNode;
  variant?: TypographyVariant;
  tone?: TextTone;
  color?: ThemeColorKey;
  align?: TextAlign;
  style?: StyleProp<TextStyle>;
};

const toneMap: Record<TextTone, ThemeColorKey> = {
  primary: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  inverse: 'textInverse',
  accent: 'primary',
  success: 'success',
  error: 'error',
  warning: 'warning',
};

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
  },
  system: {
    fontFamily: theme.typography.fontFamily,
  },
  medium: {
    fontFamily: 'Jost_500Medium',
  },
  displayFamily: {
    fontFamily: theme.typography.displayFontFamily,
  },
  display: theme.typography.variants.display,
  h1: theme.typography.variants.h1,
  h2: theme.typography.variants.h2,
  title: theme.typography.variants.title,
  subtitle: theme.typography.variants.subtitle,
  body: theme.typography.variants.body,
  bodySmall: theme.typography.variants.bodySmall,
  caption: theme.typography.variants.caption,
  button: theme.typography.variants.button,
  label: theme.typography.variants.label,
});

export function Typography({
  children,
  variant = 'body',
  tone = 'primary',
  color,
  align = 'auto',
  style,
  ...props
}: TypographyProps) {
  const resolvedColor = color ? theme.colors[color] : theme.colors[toneMap[tone]];

  return (
    <Text
      {...props}
      style={[
        styles.base,
        variant === 'display' ? styles.displayFamily
          : ['h1', 'h2', 'title', 'subtitle', 'button', 'label'].includes(variant) ? styles.medium
          : styles.system,
        styles[variant],
        {
          color: resolvedColor,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export default Typography;
