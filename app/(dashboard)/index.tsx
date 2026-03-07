import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const summaryCards = [
  { title: "Total Monthly Spend", value: "$24,500", change: "-12%", trend: "down" as const, icon: "dollar-sign" as const, color: "#6366F1" },
  { title: "Active Subscriptions", value: "47", change: "+3", trend: "up" as const, icon: "credit-card" as const, color: "#3B82F6" },
  { title: "Monthly Savings", value: "$3,200", change: "+24%", trend: "up" as const, icon: "trending-up" as const, color: "#22C55E" },
  { title: "AI Recommendations", value: "12", change: "New", trend: "up" as const, icon: "zap" as const, color: "#F59E0B" },
];

const recentActivity = [
  { id: "1", action: "Price increase detected", vendor: "Slack", detail: "+$2/user/mo", time: "2 hours ago", type: "warning" },
  { id: "2", action: "Subscription cancelled", vendor: "Notion", detail: "Saved $120/mo", time: "5 hours ago", type: "success" },
  { id: "3", action: "Negotiation complete", vendor: "AWS", detail: "15% discount secured", time: "1 day ago", type: "success" },
  { id: "4", action: "Contract expiring", vendor: "Salesforce", detail: "Renews in 30 days", time: "2 days ago", type: "destructive" },
  { id: "5", action: "New recommendation", vendor: "Zoom", detail: "Downgrade available", time: "3 days ago", type: "default" },
];

const savingsGoals = [
  { label: "Q1 Savings Target", current: 9600, target: 12000 },
  { label: "Vendor Negotiations", current: 4200, target: 5000 },
  { label: "Auto-Cancellations", current: 2800, target: 3000 },
];

export default function DashboardOverview() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Summary Cards */}
      <View className="flex-row flex-wrap gap-3 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="flex-1 min-w-[46%]">
            <CardContent className="p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: card.color + "15" }}>
                  <Feather name={card.icon} size={18} color={card.color} />
                </View>
                <Badge variant={card.trend === "up" ? "success" : "warning"}>
                  {card.change}
                </Badge>
              </View>
              <Text className="text-2xl font-bold text-foreground">{card.value}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">{card.title}</Text>
            </CardContent>
          </Card>
        ))}
      </View>

      {/* Spending Trend Placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Spending Trend</CardTitle>
          <CardDescription>Monthly spending over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <View className="h-48 bg-muted rounded-lg items-center justify-center">
            <Feather name="bar-chart-2" size={32} color="#94A3B8" />
            <Text className="text-sm text-muted-foreground mt-2">Chart visualization</Text>
          </View>
        </CardContent>
      </Card>

      {/* Savings Goals */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Savings Goals</CardTitle>
          <CardDescription>Track progress toward your savings targets</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {savingsGoals.map((goal) => (
            <View key={goal.label}>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-sm text-foreground">{goal.label}</Text>
                <Text className="text-sm text-muted-foreground">
                  ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                </Text>
              </View>
              <Progress value={goal.current} max={goal.target} />
            </View>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="gap-3">
          {recentActivity.map((item) => (
            <View key={item.id} className="flex-row items-start gap-3 py-2 border-b border-border last:border-b-0">
              <View className="w-8 h-8 bg-muted rounded-full items-center justify-center mt-0.5">
                <Feather name="activity" size={14} color="#64748B" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-sm font-medium text-foreground">{item.action}</Text>
                  <Badge variant={item.type as any} className="px-1.5 py-0">
                    {item.detail}
                  </Badge>
                </View>
                <Text className="text-xs text-muted-foreground">{item.vendor} · {item.time}</Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
