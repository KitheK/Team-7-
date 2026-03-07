import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { dashboardSections } from "../../constants/navigation";
import { Separator } from "../ui/Separator";

interface SidebarNavProps {
  onClose?: () => void;
}

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  home: "home",
  "credit-card": "credit-card",
  cpu: "cpu",
  "piggy-bank": "dollar-sign",
  "trending-up": "trending-up",
  "pie-chart": "pie-chart",
  "bar-chart-2": "bar-chart-2",
  "message-square": "message-square",
  book: "book",
  "x-circle": "x-circle",
  zap: "zap",
  mail: "mail",
  phone: "phone",
  target: "target",
  clock: "clock",
  "file-text": "file-text",
  "dollar-sign": "dollar-sign",
  file: "file",
  link: "link",
  users: "users",
  shield: "shield",
  bell: "bell",
};

export function SidebarNav({ onClose }: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-4 flex-row items-center gap-2 border-b border-border">
        <View className="w-8 h-8 bg-primary rounded-lg items-center justify-center">
          <Feather name="layers" size={18} color="#fff" />
        </View>
        <Text className="text-lg font-bold text-foreground">WealthGuard</Text>
      </View>

      <ScrollView className="flex-1 px-2 py-2" showsVerticalScrollIndicator={false}>
        {dashboardSections.map((section, idx) => (
          <View key={section.title}>
            {idx > 0 && <Separator className="my-2" />}
            <Text className="text-xs font-semibold text-muted-foreground uppercase px-3 py-2">
              {section.title}
            </Text>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/(dashboard)" && pathname === "/") ||
                (item.href === "/(dashboard)" && pathname === "/(dashboard)");
              const featherIcon = iconMap[item.icon] ?? "circle";

              return (
                <Pressable
                  key={item.href}
                  className={`flex-row items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 ${isActive ? "bg-primary-50" : ""}`}
                  onPress={() => {
                    router.push(item.href as any);
                    onClose?.();
                  }}
                >
                  <Feather name={featherIcon} size={18} color={isActive ? "#6366F1" : "#64748B"} />
                  <Text className={`text-sm ${isActive ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
