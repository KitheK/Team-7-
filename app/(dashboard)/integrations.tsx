import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Switch } from "../../components/ui/Switch";
import { useState } from "react";

const integrations = [
  { id: "1", name: "QuickBooks", description: "Accounting & financial data sync", category: "Accounting", connected: true, lastSync: "2 hours ago" },
  { id: "2", name: "Plaid", description: "Bank account connection for transaction data", category: "Banking", connected: true, lastSync: "1 hour ago" },
  { id: "3", name: "Stripe", description: "Payment processing and billing data", category: "Payments", connected: true, lastSync: "30 min ago" },
  { id: "4", name: "Xero", description: "Accounting software integration", category: "Accounting", connected: false, lastSync: "—" },
  { id: "5", name: "Google Workspace", description: "Calendar and email integration", category: "Productivity", connected: true, lastSync: "5 min ago" },
  { id: "6", name: "Microsoft 365", description: "Office suite and email integration", category: "Productivity", connected: false, lastSync: "—" },
  { id: "7", name: "Okta", description: "SSO and identity management", category: "Security", connected: true, lastSync: "1 day ago" },
];

export default function IntegrationsView() {
  const [states, setStates] = useState(
    Object.fromEntries(integrations.map((i) => [i.id, i.connected]))
  );

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Connected</Text>
            <Text className="text-2xl font-bold text-foreground">{Object.values(states).filter(Boolean).length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Available</Text>
            <Text className="text-2xl font-bold text-foreground">{integrations.length}</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect your tools to sync data automatically</CardDescription>
        </CardHeader>
        <CardContent className="gap-0 p-0">
          {integrations.map((int, idx) => (
            <View key={int.id} className={`px-4 py-3.5 flex-row items-center gap-3 ${idx < integrations.length - 1 ? "border-b border-border" : ""}`}>
              <View className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center">
                <Feather name="link" size={18} color="#6366F1" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-foreground">{int.name}</Text>
                  <Badge variant="outline">{int.category}</Badge>
                </View>
                <Text className="text-xs text-muted-foreground">{int.description}</Text>
                {states[int.id] && <Text className="text-xs text-success mt-0.5">Last sync: {int.lastSync}</Text>}
              </View>
              <Switch
                value={states[int.id]}
                onValueChange={(v) => setStates((s) => ({ ...s, [int.id]: v }))}
              />
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
