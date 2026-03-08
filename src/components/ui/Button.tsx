import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import theme from '../../../constants/theme';
import Typography from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    columnGap: theme.spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.subtle,
  },
  secondary: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  outline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.borderStrong,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.lg,
  },
  md: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.xl,
  },
  lg: {
    minHeight: 60,
    paddingHorizontal: theme.spacing.xxl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.sm,
  },
  textPrimary: {
    color: theme.colors.textInverse,
  },
  textSecondary: {
    color: theme.colors.text,
  },
  textOutline: {
    color: theme.colors.textSecondary,
  },
});

const spinnerTone: Record<ButtonVariant, string> = {
  primary: theme.colors.textInverse,
  secondary: theme.colors.text,
  outline: theme.colors.text,
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  loading = false,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed, hovered }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        {
          opacity: isDisabled ? 0.5 : pressed ? 0.92 : 1,
          transform: [{ translateY: pressed ? 1 : hovered ? -1 : 0 }, { scale: pressed ? 0.99 : 1 }],
        },
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator size="small" color={spinnerTone[variant]} /> : leftIcon}
        <Typography
          variant="button"
          style={[
            variant === 'primary'
              ? styles.textPrimary
              : variant === 'secondary'
                ? styles.textSecondary
                : styles.textOutline,
            textStyle,
          ]}
        >
          {label}
        </Typography>
        {!loading ? rightIcon : null}
      </View>
    </Pressable>
  );
}

export default Button;
