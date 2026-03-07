import { View, Text, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "../ui/Avatar";

interface TopNavProps {
  onMenuPress?: () => void;
  title?: string;
}

export function TopNav({ onMenuPress, title }: TopNavProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-border">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={onMenuPress} className="p-1">
          <Feather name="menu" size={22} color="#0F172A" />
        </Pressable>
        {title && <Text className="text-lg font-semibold text-foreground">{title}</Text>}
      </View>
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center bg-muted rounded-lg px-3 py-2 gap-2 min-w-[160px]">
          <Feather name="search" size={16} color="#64748B" />
          <TextInput
            className="text-sm text-foreground flex-1"
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
          />
        </View>
        <Pressable className="relative p-1">
          <Feather name="bell" size={20} color="#64748B" />
          <View className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
        </Pressable>
        <Avatar fallback="JD" size="sm" />
      </View>
    </View>
  );
}
