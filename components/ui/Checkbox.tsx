import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked = false, onCheckedChange, disabled = false, className = "" }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange?.(!checked)}
      className={`w-5 h-5 rounded border items-center justify-center ${checked ? "bg-primary border-primary" : "bg-transparent border-border"} ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {checked && <Feather name="check" size={14} color="#fff" />}
    </Pressable>
  );
}
