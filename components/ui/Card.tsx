import { View, Text, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <View className={`bg-card rounded-xl border border-border p-0 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardHeader({ className = "", children, ...props }: CardProps) {
  return (
    <View className={`p-4 pb-2 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardContent({ className = "", children, ...props }: CardProps) {
  return (
    <View className={`p-4 pt-2 ${className}`} {...props}>
      {children}
    </View>
  );
}

export function CardFooter({ className = "", children, ...props }: CardProps) {
  return (
    <View className={`p-4 pt-2 flex-row items-center ${className}`} {...props}>
      {children}
    </View>
  );
}

interface CardTextProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className = "", children }: CardTextProps) {
  return (
    <Text className={`text-lg font-semibold text-card-foreground ${className}`}>
      {children}
    </Text>
  );
}

export function CardDescription({ className = "", children }: CardTextProps) {
  return (
    <Text className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </Text>
  );
}
