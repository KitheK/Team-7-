import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

const contracts = [
  { id: "1", vendor: "AWS", type: "Enterprise Agreement", start: "Jun 2025", end: "Jun 2026", value: 54000, autoRenew: true, daysLeft: 86 },
  { id: "2", vendor: "Salesforce", type: "Annual License", start: "Jul 2025", end: "Jul 2026", value: 36000, autoRenew: true, daysLeft: 130 },
  { id: "3", vendor: "Slack", type: "Annual License", start: "Mar 2025", end: "Mar 2026", value: 13500, autoRenew: true, daysLeft: 23 },
  { id: "4", vendor: "GitHub", type: "Annual License", start: "Apr 2025", end: "Apr 2026", value: 7560, autoRenew: false, daysLeft: 55 },
  { id: "5", vendor: "Datadog", type: "Enterprise Agreement", start: "Sep 2025", end: "Sep 2026", value: 7680, autoRenew: true, daysLeft: 191 },
  { id: "6", vendor: "Zoom", type: "Annual License", start: "Mar 2025", end: "Mar 2026", value: 11394, autoRenew: true, daysLeft: 23 },
];

function getUrgency(daysLeft: number): { variant: "destructive" | "warning" | "success"; label: string } {
  if (daysLeft <= 30) return { variant: "destructive", label: `${daysLeft} days left` };
  if (daysLeft <= 90) return { variant: "warning", label: `${daysLeft} days left` };
  return { variant: "success", label: `${daysLeft} days left` };
}

export default function ContractsView() {
  const totalValue = contracts.reduce((s, c) => s + c.value, 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Active Contracts</Text>
            <Text className="text-2xl font-bold text-foreground">{contracts.length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Total Annual Value</Text>
            <Text className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-6">
        <CardHeader><CardTitle>Contracts</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {contracts.map((c, idx) => {
            const urgency = getUrgency(c.daysLeft);
            return (
              <Pressable key={c.id} className={`px-4 py-3.5 ${idx < contracts.length - 1 ? "border-b border-border" : ""}`}>
                <View className="flex-row items-center justify-between mb-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="w-9 h-9 bg-primary-50 rounded-lg items-center justify-center">
                      <Feather name="file" size={16} color="#6366F1" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-foreground">{c.vendor}</Text>
                      <Text className="text-xs text-muted-foreground">{c.type}</Text>
                    </View>
                  </View>
                  <Badge variant={urgency.variant}>{urgency.label}</Badge>
                </View>
                <View className="flex-row gap-4 ml-11">
                  <View>
                    <Text className="text-xs text-muted-foreground">Period</Text>
                    <Text className="text-xs text-foreground">{c.start} - {c.end}</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">Value</Text>
                    <Text className="text-xs font-semibold text-foreground">${c.value.toLocaleString()}/yr</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">Auto-Renew</Text>
                    <Text className={`text-xs ${c.autoRenew ? "text-warning" : "text-muted-foreground"}`}>{c.autoRenew ? "Yes" : "No"}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
