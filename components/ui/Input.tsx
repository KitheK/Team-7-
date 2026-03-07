import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName = "", className = "", ...props }: InputProps) {
  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>
      )}
      <TextInput
        className={`border rounded-lg px-3.5 py-2.5 text-sm text-foreground ${error ? "border-destructive" : "border-border"} ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && (
        <Text className="text-xs text-destructive mt-1">{error}</Text>
      )}
    </View>
  );
}
