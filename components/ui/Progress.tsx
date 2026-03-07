import { View } from "react-native";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ value, max = 100, className = "", indicatorClassName = "" }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <View className={`h-2 bg-muted rounded-full overflow-hidden ${className}`}>
      <View
        className={`h-full bg-primary rounded-full ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
