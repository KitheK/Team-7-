import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";

export function LandingNav() {
  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-border">
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 bg-primary rounded-lg items-center justify-center">
          <Feather name="layers" size={18} color="#fff" />
        </View>
        <Text className="text-xl font-bold text-foreground">WealthGuard</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Link href="/login" asChild>
          <Pressable className="px-4 py-2 rounded-lg">
            <Text className="text-sm font-medium text-muted-foreground">Sign In</Text>
          </Pressable>
        </Link>
        <Link href="/signup" asChild>
          <Pressable className="px-4 py-2 bg-primary rounded-lg">
            <Text className="text-sm font-medium text-white">Get Started</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
