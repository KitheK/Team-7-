import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Progress } from "../../components/ui/Progress";

const recommendations = [
  { id: "1", action: "Cancel", vendor: "Notion", reason: "Duplicate with Confluence", savings: 500, confidence: 94, priority: "high" },
  { id: "2", action: "Downgrade", vendor: "Zoom", reason: "80% of users only need Basic plan", savings: 475, confidence: 89, priority: "high" },
  { id: "3", action: "Negotiate", vendor: "Salesforce", reason: "Contract renews in 30 days - leverage competition", savings: 600, confidence: 76, priority: "high" },
  { id: "4", action: "Cancel", vendor: "Loom", reason: "Low adoption rate (12%)", savings: 312, confidence: 88, priority: "medium" },
  { id: "5", action: "Downgrade", vendor: "Slack", reason: "Can move to Slack Pro from Business+", savings: 225, confidence: 82, priority: "medium" },
  { id: "6", action: "Negotiate", vendor: "AWS", reason: "Usage-based pricing optimization available", savings: 780, confidence: 71, priority: "medium" },
  { id: "7", action: "Cancel", vendor: "Miro", reason: "Figma whiteboard covers use cases", savings: 200, confidence: 85, priority: "low" },
];

const actionConfig: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  Cancel: { icon: "x-circle", color: "#EF4444" },
  Downgrade: { icon: "arrow-down-circle", color: "#F59E0B" },
  Negotiate: { icon: "message-square", color: "#3B82F6" },
};

export default function AIRecommendationsView() {
  const totalSavings = recommendations.reduce((s, r) => s + r.savings, 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Recommendations</Text>
            <Text className="text-2xl font-bold text-foreground">{recommendations.length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Projected Savings</Text>
            <Text className="text-2xl font-bold text-success">${totalSavings.toLocaleString()}/mo</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 p-0">
          {recommendations.map((rec, idx) => {
            const config = actionConfig[rec.action];
            return (
              <View key={rec.id} className={`px-4 py-3.5 ${idx < recommendations.length - 1 ? "border-b border-border" : ""}`}>
                <View className="flex-row items-start gap-3">
                  <View className="w-9 h-9 rounded-lg items-center justify-center" style={{ backgroundColor: config.color + "15" }}>
                    <Feather name={config.icon} size={18} color={config.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="text-sm font-medium text-foreground">{rec.action} {rec.vendor}</Text>
                      <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "warning" : "default"}>{rec.priority}</Badge>
                    </View>
                    <Text className="text-xs text-muted-foreground mb-2">{rec.reason}</Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row gap-3">
                        <Text className="text-xs text-muted-foreground">Save <Text className="font-semibold text-success">${rec.savings}/mo</Text></Text>
                        <View className="flex-row items-center gap-1">
                          <Progress value={rec.confidence} className="w-12 h-1.5" />
                          <Text className="text-xs text-muted-foreground">{rec.confidence}%</Text>
                        </View>
                      </View>
                      <Button size="sm" variant="outline"><Text className="text-xs font-medium text-foreground">Act</Text></Button>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
