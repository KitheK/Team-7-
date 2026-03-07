import { View } from "react-native";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Separator({ orientation = "horizontal", className = "" }: SeparatorProps) {
  return (
    <View
      className={`bg-border ${orientation === "horizontal" ? "h-px w-full" : "w-px h-full"} ${className}`}
    />
  );
}
