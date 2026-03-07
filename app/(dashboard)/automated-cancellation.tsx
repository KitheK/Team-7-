import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { useState } from "react";

const cancellationQueue = [
  { id: "1", name: "Notion", reason: "Duplicate functionality with Confluence", monthlyCost: 500, status: "pending_approval", confidence: 94 },
  { id: "2", name: "Trello", reason: "Team migrated to Jira", monthlyCost: 120, status: "scheduled", confidence: 98 },
  { id: "3", name: "Loom", reason: "Low usage - 3 active users out of 25 licenses", monthlyCost: 312, status: "pending_approval", confidence: 88 },
  { id: "4", name: "Monday.com", reason: "Overlaps with existing project management tools", monthlyCost: 240, status: "cancelled", confidence: 91 },
  { id: "5", name: "Miro", reason: "Can be replaced by Figma's whiteboard feature", monthlyCost: 200, status: "pending_approval", confidence: 85 },
];

const statusConfig: Record<string, { variant: "warning" | "default" | "success"; label: string }> = {
  pending_approval: { variant: "warning", label: "Pending Approval" },
  scheduled: { variant: "default", label: "Scheduled" },
  cancelled: { variant: "success", label: "Cancelled" },
};

export default function AutomatedCancellationView() {
  const [autoMode, setAutoMode] = useState(false);
  const totalSavings = cancellationQueue.reduce((sum, c) => sum + c.monthlyCost, 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Queued for Cancellation</Text>
            <Text className="text-2xl font-bold text-foreground">{cancellationQueue.filter(c => c.status !== "cancelled").length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Potential Savings</Text>
            <Text className="text-2xl font-bold text-success">${totalSavings.toLocaleString()}/mo</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-4">
        <CardContent className="p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-medium text-foreground">Auto-Cancellation Mode</Text>
            <Text className="text-xs text-muted-foreground">Automatically cancel subscriptions with 95%+ confidence</Text>
          </View>
          <Switch value={autoMode} onValueChange={setAutoMode} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cancellation Queue</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 p-0">
          {cancellationQueue.map((item, idx) => {
            const config = statusConfig[item.status];
            return (
              <View key={item.id} className={`px-4 py-3.5 ${idx < cancellationQueue.length - 1 ? "border-b border-border" : ""}`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-9 h-9 bg-destructive/10 rounded-lg items-center justify-center">
                      <Feather name="x-circle" size={18} color="#EF4444" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-foreground">{item.name}</Text>
                      <Text className="text-xs text-muted-foreground">${item.monthlyCost}/mo · {item.confidence}% confidence</Text>
                    </View>
                  </View>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </View>
                <Text className="text-xs text-muted-foreground ml-11 mb-2">{item.reason}</Text>
                {item.status === "pending_approval" && (
                  <View className="flex-row gap-2 ml-11">
                    <Button size="sm" variant="default"><Text className="text-xs text-white font-medium">Approve</Text></Button>
                    <Button size="sm" variant="outline"><Text className="text-xs text-foreground font-medium">Dismiss</Text></Button>
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
