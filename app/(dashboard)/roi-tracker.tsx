import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const roiMetrics = [
  { label: "Platform Cost", value: "$299/mo", icon: "credit-card" as const },
  { label: "Total Savings", value: "$3,200/mo", icon: "trending-up" as const },
  { label: "ROI", value: "970%", icon: "target" as const },
  { label: "Payback Period", value: "3 days", icon: "clock" as const },
];

const savingsSources = [
  { source: "Vendor Negotiations", amount: 1200, percentage: 38 },
  { source: "Cancelled Subscriptions", amount: 800, percentage: 25 },
  { source: "License Optimization", amount: 620, percentage: 19 },
  { source: "Plan Downgrades", amount: 380, percentage: 12 },
  { source: "Annual Billing", amount: 200, percentage: 6 },
];

const monthlyROI = [
  { month: "Oct", savings: 1800, cost: 299 },
  { month: "Nov", savings: 2200, cost: 299 },
  { month: "Dec", savings: 2600, cost: 299 },
  { month: "Jan", savings: 2900, cost: 299 },
  { month: "Feb", savings: 3100, cost: 299 },
  { month: "Mar", savings: 3200, cost: 299 },
];

export default function ROITrackerView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row flex-wrap gap-3 mb-4">
        {roiMetrics.map((m) => (
          <Card key={m.label} className="flex-1 min-w-[46%]">
            <CardContent className="p-4">
              <Feather name={m.icon} size={18} color="#6366F1" />
              <Text className="text-2xl font-bold text-foreground mt-1">{m.value}</Text>
              <Text className="text-xs text-muted-foreground">{m.label}</Text>
            </CardContent>
          </Card>
        ))}
      </View>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Savings vs. Platform Cost</CardTitle>
          <CardDescription>Monthly comparison of savings generated vs. subscription cost</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="gap-2">
            {monthlyROI.map((d) => (
              <View key={d.month} className="flex-row items-center gap-2">
                <Text className="text-xs text-muted-foreground w-8">{d.month}</Text>
                <View className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex-row">
                  <View className="h-full bg-primary rounded-l-full" style={{ width: `${(d.savings / 3500) * 100}%` }} />
                </View>
                <Text className="text-xs font-medium text-foreground w-16 text-right">${d.savings}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row items-center gap-4 mt-3 justify-center">
            <View className="flex-row items-center gap-1">
              <View className="w-3 h-3 rounded-full bg-primary" />
              <Text className="text-xs text-muted-foreground">Savings</Text>
            </View>
            <Text className="text-xs text-muted-foreground">Platform cost: $299/mo</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Savings by Source</CardTitle></CardHeader>
        <CardContent className="gap-3">
          {savingsSources.map((s) => (
            <View key={s.source}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-foreground">{s.source}</Text>
                <Text className="text-sm font-semibold text-foreground">${s.amount.toLocaleString()}/mo</Text>
              </View>
              <Progress value={s.percentage} className="h-1.5" />
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
