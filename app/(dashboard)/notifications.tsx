import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Separator } from "../../components/ui/Separator";
import { useState } from "react";

const notificationSettings = [
  { id: "price_alerts", label: "Price Increase Alerts", description: "Get notified when a vendor increases pricing", email: true, push: true, inApp: true },
  { id: "savings_milestones", label: "Savings Milestones", description: "Celebrate when you hit savings goals", email: true, push: true, inApp: true },
  { id: "contract_renewals", label: "Contract Renewal Reminders", description: "Reminders before contracts auto-renew", email: true, push: true, inApp: true },
  { id: "ai_recommendations", label: "AI Recommendations", description: "New optimization opportunities found by AI", email: false, push: true, inApp: true },
  { id: "negotiation_updates", label: "Negotiation Updates", description: "Status updates on active vendor negotiations", email: true, push: false, inApp: true },
  { id: "team_activity", label: "Team Activity", description: "When team members make changes or updates", email: false, push: false, inApp: true },
  { id: "weekly_digest", label: "Weekly Digest", description: "Summary of savings and activity each week", email: true, push: false, inApp: false },
];

export default function NotificationsView() {
  const [settings, setSettings] = useState(
    Object.fromEntries(notificationSettings.map((n) => [n.id, { email: n.email, push: n.push, inApp: n.inApp }]))
  );

  const toggle = (id: string, channel: "email" | "push" | "inApp") => {
    setSettings((s) => ({ ...s, [id]: { ...s[id], [channel]: !s[id][channel] } }));
  };

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header Row */}
          <View className="flex-row items-center px-4 py-2 border-b border-border bg-muted">
            <View className="flex-1" />
            <View className="w-16 items-center"><Text className="text-xs font-medium text-muted-foreground">Email</Text></View>
            <View className="w-16 items-center"><Text className="text-xs font-medium text-muted-foreground">Push</Text></View>
            <View className="w-16 items-center"><Text className="text-xs font-medium text-muted-foreground">In-App</Text></View>
          </View>
          {notificationSettings.map((notif, idx) => (
            <View key={notif.id} className={`flex-row items-center px-4 py-3.5 ${idx < notificationSettings.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-foreground">{notif.label}</Text>
                <Text className="text-xs text-muted-foreground">{notif.description}</Text>
              </View>
              <View className="w-16 items-center">
                <Switch value={settings[notif.id]?.email} onValueChange={() => toggle(notif.id, "email")} />
              </View>
              <View className="w-16 items-center">
                <Switch value={settings[notif.id]?.push} onValueChange={() => toggle(notif.id, "push")} />
              </View>
              <View className="w-16 items-center">
                <Switch value={settings[notif.id]?.inApp} onValueChange={() => toggle(notif.id, "inApp")} />
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
