import { View, Text } from "react-native";

const variantClasses = {
  default: "bg-primary",
  secondary: "bg-secondary",
  destructive: "bg-destructive",
  outline: "bg-transparent border border-border",
  success: "bg-success",
  warning: "bg-warning",
};

const variantTextClasses = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  success: "text-white",
  warning: "text-white",
};

interface BadgeProps {
  variant?: keyof typeof variantClasses;
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  return (
    <View className={`px-2.5 py-0.5 rounded-full ${variantClasses[variant]} ${className}`}>
      {typeof children === "string" ? (
        <Text className={`text-xs font-medium ${variantTextClasses[variant]}`}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
