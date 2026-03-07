import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { useState } from "react";

const callHistory = [
  { id: "1", vendor: "Zoom", topic: "Price Negotiation", duration: "12 min", outcome: "15% discount secured", date: "Mar 5, 2026", status: "success" },
  { id: "2", vendor: "HubSpot", topic: "Contract Review", duration: "8 min", outcome: "Pending follow-up", date: "Mar 3, 2026", status: "pending" },
  { id: "3", vendor: "AWS", topic: "Usage Optimization", duration: "15 min", outcome: "Reserved instance savings", date: "Feb 28, 2026", status: "success" },
  { id: "4", vendor: "Slack", topic: "Plan Downgrade", duration: "6 min", outcome: "Downgraded to Pro", date: "Feb 25, 2026", status: "success" },
];

export default function AICallSettingsView() {
  const [aiCalls, setAiCalls] = useState(true);
  const [recording, setRecording] = useState(true);
  const [autoFollow, setAutoFollow] = useState(false);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>AI Call Preferences</CardTitle>
          <CardDescription>Configure how AI handles vendor calls on your behalf</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Enable AI Calls</Text>
              <Text className="text-xs text-muted-foreground">Allow AI to make calls to vendors for negotiations</Text>
            </View>
            <Switch value={aiCalls} onValueChange={setAiCalls} />
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Call Recording</Text>
              <Text className="text-xs text-muted-foreground">Record calls for review and compliance</Text>
            </View>
            <Switch value={recording} onValueChange={setRecording} />
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Auto Follow-up</Text>
              <Text className="text-xs text-muted-foreground">Automatically send follow-up emails after calls</Text>
            </View>
            <Switch value={autoFollow} onValueChange={setAutoFollow} />
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Call Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex-row gap-3">
          <View className="flex-1 bg-muted p-3 rounded-lg items-center">
            <Text className="text-lg font-bold text-foreground">{callHistory.length}</Text>
            <Text className="text-xs text-muted-foreground">Total Calls</Text>
          </View>
          <View className="flex-1 bg-muted p-3 rounded-lg items-center">
            <Text className="text-lg font-bold text-success">{callHistory.filter(c => c.status === "success").length}</Text>
            <Text className="text-xs text-muted-foreground">Successful</Text>
          </View>
          <View className="flex-1 bg-muted p-3 rounded-lg items-center">
            <Text className="text-lg font-bold text-foreground">10 min</Text>
            <Text className="text-xs text-muted-foreground">Avg Duration</Text>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Call History</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {callHistory.map((call, idx) => (
            <View key={call.id} className={`px-4 py-3.5 ${idx < callHistory.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 bg-primary-50 rounded-full items-center justify-center">
                    <Feather name="phone" size={14} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{call.vendor}</Text>
                    <Text className="text-xs text-muted-foreground">{call.topic} · {call.duration}</Text>
                  </View>
                </View>
                <Badge variant={call.status === "success" ? "success" : "warning"}>{call.status}</Badge>
              </View>
              <Text className="text-xs text-muted-foreground ml-10">{call.outcome} · {call.date}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
