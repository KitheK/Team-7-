import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Progress } from "../../components/ui/Progress";

const insights = [
  {
    id: "1",
    type: "savings",
    title: "Consolidate Communication Tools",
    description: "You're paying for both Slack ($562/mo) and Microsoft Teams ($420/mo). Consolidating to one platform could save $420/mo.",
    impact: "$5,040/yr",
    confidence: 92,
    priority: "high",
  },
  {
    id: "2",
    type: "warning",
    title: "Zoom Price Increase Detected",
    description: "Zoom has increased per-user pricing by 15% compared to your original contract. Consider renegotiating.",
    impact: "$1,710/yr",
    confidence: 98,
    priority: "high",
  },
  {
    id: "3",
    type: "optimization",
    title: "Underutilized GitHub Seats",
    description: "12 of 30 GitHub seats haven't been used in 60+ days. Reducing to 18 seats would save $252/mo.",
    impact: "$3,024/yr",
    confidence: 87,
    priority: "medium",
  },
  {
    id: "4",
    type: "savings",
    title: "Annual Billing Opportunity",
    description: "Switching 5 subscriptions from monthly to annual billing could save an average of 17%.",
    impact: "$2,880/yr",
    confidence: 95,
    priority: "medium",
  },
  {
    id: "5",
    type: "risk",
    title: "Contract Auto-Renewal Alert",
    description: "3 contracts are set to auto-renew in the next 30 days. Review terms before renewal.",
    impact: "$8,400/yr at stake",
    confidence: 100,
    priority: "high",
  },
];

const typeConfig: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  savings: { icon: "dollar-sign", color: "#22C55E", bg: "#22C55E15" },
  warning: { icon: "alert-triangle", color: "#F59E0B", bg: "#F59E0B15" },
  optimization: { icon: "sliders", color: "#3B82F6", bg: "#3B82F615" },
  risk: { icon: "alert-circle", color: "#EF4444", bg: "#EF444415" },
};

export default function AIInsightsView() {
  const totalSavings = "$20,054";

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Header Card */}
      <Card className="mb-6 bg-primary border-0">
        <CardContent className="p-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="cpu" size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">AI Analysis Summary</Text>
          </View>
          <Text className="text-3xl font-bold text-white mb-1">{totalSavings}</Text>
          <Text className="text-sm text-primary-200">Total potential annual savings identified</Text>
          <View className="flex-row gap-4 mt-4">
            <View>
              <Text className="text-lg font-bold text-white">{insights.length}</Text>
              <Text className="text-xs text-primary-200">Active Insights</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-white">{insights.filter(i => i.priority === "high").length}</Text>
              <Text className="text-xs text-primary-200">High Priority</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-white">93%</Text>
              <Text className="text-xs text-primary-200">Avg Confidence</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Insights List */}
      <View className="gap-3">
        {insights.map((insight) => {
          const config = typeConfig[insight.type] ?? typeConfig.savings;
          return (
            <Card key={insight.id}>
              <CardContent className="p-4">
                <View className="flex-row items-start gap-3">
                  <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: config.bg }}>
                    <Feather name={config.icon} size={20} color={config.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-sm font-semibold text-foreground flex-1">{insight.title}</Text>
                      <Badge variant={insight.priority === "high" ? "destructive" : "warning"}>
                        {insight.priority}
                      </Badge>
                    </View>
                    <Text className="text-xs text-muted-foreground mb-3">{insight.description}</Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View>
                          <Text className="text-xs text-muted-foreground">Impact</Text>
                          <Text className="text-sm font-semibold text-foreground">{insight.impact}</Text>
                        </View>
                        <View>
                          <Text className="text-xs text-muted-foreground">Confidence</Text>
                          <View className="flex-row items-center gap-1.5">
                            <Progress value={insight.confidence} className="w-16 h-1.5" />
                            <Text className="text-xs font-medium text-foreground">{insight.confidence}%</Text>
                          </View>
                        </View>
                      </View>
                      <Button size="sm" variant="outline">
                        <Text className="text-xs font-medium text-foreground">Review</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              </CardContent>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
