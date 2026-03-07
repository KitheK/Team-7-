import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const timelineData = [
  { month: "Mar 2026", saved: 3200, cumulative: 15800, events: ["Zoom discount negotiated", "Loom cancellation"] },
  { month: "Feb 2026", saved: 3100, cumulative: 12600, events: ["AWS reserved instances", "GitHub seat optimization"] },
  { month: "Jan 2026", saved: 2900, cumulative: 9500, events: ["Salesforce renegotiation", "Annual billing switch"] },
  { month: "Dec 2025", saved: 2600, cumulative: 6600, events: ["Datadog discount", "Notion cancelled"] },
  { month: "Nov 2025", saved: 2200, cumulative: 4000, events: ["Slack downgrade", "Monday.com cancelled"] },
  { month: "Oct 2025", saved: 1800, cumulative: 1800, events: ["Platform onboarding", "Initial audit complete"] },
];

const milestones = [
  { amount: "$5,000", date: "Nov 2025", reached: true },
  { amount: "$10,000", date: "Jan 2026", reached: true },
  { amount: "$15,000", date: "Mar 2026", reached: true },
  { amount: "$25,000", date: "Jun 2026", reached: false },
  { amount: "$50,000", date: "Dec 2026", reached: false },
];

export default function SavingsTimelineView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Total Saved to Date</Text>
            <Text className="text-2xl font-bold text-foreground">$15,800</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Projected Annual</Text>
            <Text className="text-2xl font-bold text-foreground">$38,400</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-4">
        <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
        <CardContent>
          <View className="flex-row gap-2 flex-wrap">
            {milestones.map((m) => (
              <View key={m.amount} className={`px-3 py-2 rounded-lg border ${m.reached ? "bg-success/10 border-success" : "border-border"}`}>
                <Text className={`text-sm font-semibold ${m.reached ? "text-success" : "text-muted-foreground"}`}>{m.amount}</Text>
                <Text className="text-xs text-muted-foreground">{m.date}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Savings Timeline</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {timelineData.map((entry, idx) => (
            <View key={entry.month} className={`px-4 py-4 ${idx < timelineData.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-3 h-3 rounded-full bg-primary" />
                  <Text className="text-sm font-semibold text-foreground">{entry.month}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-bold text-success">+${entry.saved.toLocaleString()}</Text>
                  <Text className="text-xs text-muted-foreground">Cumulative: ${entry.cumulative.toLocaleString()}</Text>
                </View>
              </View>
              <View className="ml-5 gap-1">
                {entry.events.map((evt) => (
                  <View key={evt} className="flex-row items-center gap-1.5">
                    <Feather name="check-circle" size={12} color="#22C55E" />
                    <Text className="text-xs text-muted-foreground">{evt}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
