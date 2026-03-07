import { View, Image, Text } from "react-native";
import { useState } from "react";

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  default: "w-10 h-10",
  lg: "w-12 h-12",
};

const textSizeClasses = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
};

export function Avatar({ src, fallback, size = "default", className = "" }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <View className={`${sizeClasses[size]} rounded-full bg-muted items-center justify-center overflow-hidden ${className}`}>
      {src && !hasError ? (
        <Image
          source={{ uri: src }}
          className="w-full h-full"
          onError={() => setHasError(true)}
        />
      ) : (
        <Text className={`font-medium text-muted-foreground ${textSizeClasses[size]}`}>
          {fallback}
        </Text>
      )}
    </View>
  );
}
