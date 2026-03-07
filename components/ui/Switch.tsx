import { Pressable, View } from "react-native";
import { useState } from "react";

interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ value = false, onValueChange, disabled = false, className = "" }: SwitchProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange?.(!value)}
      className={`w-11 h-6 rounded-full p-0.5 ${value ? "bg-primary" : "bg-muted"} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      <View
        className={`w-5 h-5 rounded-full bg-white shadow ${value ? "ml-5" : "ml-0"}`}
      />
    </Pressable>
  );
}
