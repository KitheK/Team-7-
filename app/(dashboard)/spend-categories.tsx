import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Progress } from "../../components/ui/Progress";

const categories = [
  { name: "Infrastructure", amount: 8500, percentage: 35, color: "#6366F1", icon: "server" as const, change: "+5%" },
  { name: "Communication", amount: 4200, percentage: 17, color: "#3B82F6", icon: "message-circle" as const, change: "-3%" },
  { name: "Development", amount: 3800, percentage: 16, color: "#22C55E", icon: "code" as const, change: "+2%" },
  { name: "CRM & Sales", amount: 3200, percentage: 13, color: "#F59E0B", icon: "users" as const, change: "0%" },
  { name: "Design", amount: 1800, percentage: 7, color: "#8B5CF6", icon: "pen-tool" as const, change: "-8%" },
  { name: "Marketing", amount: 1500, percentage: 6, color: "#EC4899", icon: "megaphone" as const, change: "+12%" },
  { name: "Project Management", amount: 900, percentage: 4, color: "#14B8A6", icon: "clipboard" as const, change: "+1%" },
  { name: "Other", amount: 600, percentage: 2, color: "#94A3B8", icon: "more-horizontal" as const, change: "-2%" },
];

export default function SpendCategoriesView() {
  const totalSpend = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Total */}
      <Card className="mb-4">
        <CardContent className="p-4 items-center">
          <Text className="text-xs text-muted-foreground mb-1">Total Monthly Spend</Text>
          <Text className="text-3xl font-bold text-foreground">${totalSpend.toLocaleString()}</Text>
          <Text className="text-xs text-muted-foreground mt-1">Across {categories.length} categories</Text>
        </CardContent>
      </Card>

      {/* Donut Chart Placeholder */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Spend Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="h-48 items-center justify-center">
            <View className="w-40 h-40 rounded-full border-8 border-primary items-center justify-center">
              <Text className="text-lg font-bold text-foreground">${(totalSpend / 1000).toFixed(1)}K</Text>
              <Text className="text-xs text-muted-foreground">Monthly</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3 justify-center mt-2">
            {categories.slice(0, 5).map((c) => (
              <View key={c.name} className="flex-row items-center gap-1">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <Text className="text-xs text-muted-foreground">{c.name}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Category List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="gap-4 p-4">
          {categories.map((cat) => (
            <View key={cat.name}>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center gap-2.5">
                  <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                    <Feather name={cat.icon} size={16} color={cat.color} />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{cat.name}</Text>
                    <Text className="text-xs text-muted-foreground">{cat.percentage}% of total</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-foreground">${cat.amount.toLocaleString()}</Text>
                  <Text className={`text-xs ${cat.change.startsWith("+") ? "text-destructive" : cat.change.startsWith("-") ? "text-success" : "text-muted-foreground"}`}>{cat.change}</Text>
                </View>
              </View>
              <Progress value={cat.percentage} className="h-1.5" />
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
