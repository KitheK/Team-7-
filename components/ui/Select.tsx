import { View, Text, Pressable, Modal, FlatList } from "react-native";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function Select({ options, value, onValueChange, placeholder = "Select...", label, className = "" }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className={className}>
      {label && <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text>}
      <Pressable
        className="flex-row items-center justify-between border border-border rounded-lg px-3.5 py-2.5"
        onPress={() => setOpen(true)}
      >
        <Text className={`text-sm ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color="#64748B" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setOpen(false)}>
          <View className="bg-white rounded-t-2xl max-h-[50%]">
            <View className="p-4 border-b border-border">
              <Text className="text-base font-semibold text-foreground">{label ?? "Select"}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  className={`px-4 py-3 flex-row items-center justify-between ${item.value === value ? "bg-primary-50" : ""}`}
                  onPress={() => { onValueChange?.(item.value); setOpen(false); }}
                >
                  <Text className={`text-sm ${item.value === value ? "text-primary font-medium" : "text-foreground"}`}>
                    {item.label}
                  </Text>
                  {item.value === value && <Feather name="check" size={16} color="#6366F1" />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
