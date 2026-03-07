import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Progress } from "../../components/ui/Progress";

const negotiations = [
  { id: "1", vendor: "Zoom", status: "in_progress", startDate: "Feb 15, 2026", originalCost: 18.99, targetCost: 14.99, progress: 60, assignee: "AI Agent" },
  { id: "2", vendor: "HubSpot", status: "in_progress", startDate: "Mar 1, 2026", originalCost: 50.00, targetCost: 40.00, progress: 30, assignee: "AI Agent" },
  { id: "3", vendor: "AWS", status: "completed", startDate: "Jan 10, 2026", originalCost: 5200.00, targetCost: 4420.00, progress: 100, assignee: "AI Agent" },
  { id: "4", vendor: "Salesforce", status: "pending", startDate: "Mar 5, 2026", originalCost: 150.00, targetCost: 120.00, progress: 0, assignee: "Pending" },
  { id: "5", vendor: "Datadog", status: "completed", startDate: "Dec 20, 2025", originalCost: 800.00, targetCost: 640.00, progress: 100, assignee: "AI Agent" },
];

const statusConfig: Record<string, { variant: "success" | "warning" | "default"; label: string }> = {
  completed: { variant: "success", label: "Completed" },
  in_progress: { variant: "warning", label: "In Progress" },
  pending: { variant: "default", label: "Pending" },
};

export default function VendorNegotiationsView() {
  const totalSaved = negotiations
    .filter((n) => n.status === "completed")
    .reduce((sum, n) => sum + (n.originalCost - n.targetCost), 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Active Negotiations</Text>
            <Text className="text-2xl font-bold text-foreground">{negotiations.filter((n) => n.status === "in_progress").length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Saved from Negotiations</Text>
            <Text className="text-2xl font-bold text-success">${totalSaved.toLocaleString()}/mo</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Negotiations</CardTitle>
        </CardHeader>
        <CardContent className="gap-4 p-0">
          {negotiations.map((neg, idx) => {
            const config = statusConfig[neg.status];
            return (
              <View key={neg.id} className={`px-4 py-3.5 ${idx < negotiations.length - 1 ? "border-b border-border" : ""}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-9 h-9 bg-primary-50 rounded-lg items-center justify-center">
                      <Text className="text-xs font-bold text-primary">{neg.vendor.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-foreground">{neg.vendor}</Text>
                      <Text className="text-xs text-muted-foreground">Started {neg.startDate}</Text>
                    </View>
                  </View>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </View>
                <View className="flex-row gap-4 ml-11 mb-2">
                  <View>
                    <Text className="text-xs text-muted-foreground">Original</Text>
                    <Text className="text-sm text-foreground">${neg.originalCost.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">Target</Text>
                    <Text className="text-sm font-semibold text-success">${neg.targetCost.toFixed(2)}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">Handled by</Text>
                    <Text className="text-sm text-foreground">{neg.assignee}</Text>
                  </View>
                </View>
                {neg.status !== "pending" && (
                  <View className="ml-11">
                    <Progress value={neg.progress} className="h-1.5" />
                  </View>
                )}
              </View>
            );
          })}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
