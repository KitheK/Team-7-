import React from 'react';
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import theme, { type ShadowVariant } from '../../../constants/theme';

export type CardTone = 'default' | 'muted' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export type CardProps = ViewProps & {
  children?: React.ReactNode;
  tone?: CardTone;
  padding?: CardPadding;
  shadow?: ShadowVariant;
  rounded?: keyof typeof theme.radius;
  style?: StyleProp<ViewStyle>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: theme.colors.card,
  },
  muted: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  elevated: {
    backgroundColor: theme.colors.surfaceElevated,
  },
  none: {
    padding: 0,
  },
  sm: {
    padding: theme.spacing.md,
  },
  md: {
    padding: theme.spacing.lg,
  },
  lg: {
    padding: theme.spacing.xl,
  },
  xl: {
    padding: theme.spacing.xxl,
  },
});

export function Card({
  children,
  tone = 'default',
  padding = 'lg',
  shadow = 'card',
  rounded = 'lg',
  style,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      style={[
        styles.base,
        styles[tone],
        styles[padding],
        theme.shadows[shadow],
        { borderRadius: theme.radius[rounded] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;
