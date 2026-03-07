import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const savingsBreakdown = [
  { category: "Negotiated Discounts", amount: 4200, percentage: 35, color: "#6366F1" },
  { category: "Cancelled Subscriptions", amount: 2800, percentage: 23, color: "#22C55E" },
  { category: "Downgraded Plans", amount: 1900, percentage: 16, color: "#3B82F6" },
  { category: "License Optimization", amount: 1600, percentage: 13, color: "#F59E0B" },
  { category: "Annual Billing Switch", amount: 1500, percentage: 13, color: "#8B5CF6" },
];

const monthlyData = [
  { month: "Oct", saved: 1800 },
  { month: "Nov", saved: 2200 },
  { month: "Dec", saved: 2600 },
  { month: "Jan", saved: 2900 },
  { month: "Feb", saved: 3100 },
  { month: "Mar", saved: 3200 },
];

export default function SavingsView() {
  const totalSaved = savingsBreakdown.reduce((sum, s) => sum + s.amount, 0);
  const annualProjection = totalSaved * 12;

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Summary Cards */}
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Feather name="trending-up" size={14} color="#22C55E" />
              <Text className="text-xs text-muted-foreground">Total Saved (Monthly)</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">${totalSaved.toLocaleString()}</Text>
            <Badge variant="success" className="mt-1">+24% vs last month</Badge>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Feather name="target" size={14} color="#6366F1" />
              <Text className="text-xs text-muted-foreground">Annual Projection</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground">${annualProjection.toLocaleString()}</Text>
            <Badge variant="default" className="mt-1">On track</Badge>
          </CardContent>
        </Card>
      </View>

      {/* Savings Goal */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Quarterly Savings Goal</CardTitle>
          <CardDescription>$9,600 of $12,000 target reached</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={9600} max={12000} className="h-3 mb-2" />
          <Text className="text-xs text-muted-foreground">80% complete · $2,400 remaining</Text>
        </CardContent>
      </Card>

      {/* Savings Trend */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Monthly Savings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-end gap-2 h-32">
            {monthlyData.map((d) => (
              <View key={d.month} className="flex-1 items-center">
                <View
                  className="w-full bg-primary rounded-t-md"
                  style={{ height: (d.saved / 3500) * 100 }}
                />
                <Text className="text-xs text-muted-foreground mt-1">{d.month}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Savings Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {savingsBreakdown.map((item) => (
            <View key={item.category}>
              <View className="flex-row justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <Text className="text-sm text-foreground">{item.category}</Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">${item.amount.toLocaleString()}</Text>
              </View>
              <Progress value={item.percentage} indicatorClassName="" className="h-1.5" />
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
