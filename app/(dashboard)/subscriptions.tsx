import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useState } from "react";

const subscriptions = [
  { id: "1", name: "Slack", category: "Communication", cost: 12.50, perUnit: "user/mo", users: 45, status: "active", renewal: "Mar 15, 2026", trend: "stable" },
  { id: "2", name: "GitHub", category: "Development", cost: 21.00, perUnit: "user/mo", users: 30, status: "active", renewal: "Apr 1, 2026", trend: "up" },
  { id: "3", name: "Figma", category: "Design", cost: 15.00, perUnit: "user/mo", users: 12, status: "active", renewal: "May 20, 2026", trend: "stable" },
  { id: "4", name: "Notion", category: "Productivity", cost: 10.00, perUnit: "user/mo", users: 50, status: "cancelled", renewal: "—", trend: "down" },
  { id: "5", name: "AWS", category: "Infrastructure", cost: 4500.00, perUnit: "mo", users: 1, status: "active", renewal: "Jun 1, 2026", trend: "up" },
  { id: "6", name: "Jira", category: "Project Mgmt", cost: 7.75, perUnit: "user/mo", users: 35, status: "active", renewal: "Apr 10, 2026", trend: "stable" },
  { id: "7", name: "Zoom", category: "Communication", cost: 18.99, perUnit: "user/mo", users: 50, status: "under_review", renewal: "Mar 30, 2026", trend: "up" },
  { id: "8", name: "Salesforce", category: "CRM", cost: 150.00, perUnit: "user/mo", users: 20, status: "active", renewal: "Jul 15, 2026", trend: "stable" },
];

const statusVariant: Record<string, "success" | "destructive" | "warning" | "default"> = {
  active: "success",
  cancelled: "destructive",
  under_review: "warning",
};

export default function SubscriptionsView() {
  const [search, setSearch] = useState("");
  const filtered = subscriptions.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.cost * (s.perUnit.includes("user") ? s.users : 1), 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Summary */}
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Active Subscriptions</Text>
            <Text className="text-2xl font-bold text-foreground">{subscriptions.filter((s) => s.status === "active").length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Monthly Spend</Text>
            <Text className="text-2xl font-bold text-foreground">${totalMonthly.toLocaleString()}</Text>
          </CardContent>
        </Card>
      </View>

      {/* Search and Filters */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Input placeholder="Search subscriptions..." value={search} onChangeText={setSearch} />
        </View>
        <Button variant="outline" size="icon">
          <Feather name="filter" size={18} color="#64748B" />
        </Button>
      </View>

      {/* Subscription List */}
      <Card>
        <CardContent className="p-0">
          {filtered.map((sub, idx) => (
            <Pressable
              key={sub.id}
              className={`flex-row items-center px-4 py-3.5 ${idx < filtered.length - 1 ? "border-b border-border" : ""}`}
            >
              <View className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center mr-3">
                <Text className="text-sm font-bold text-primary">{sub.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-foreground">{sub.name}</Text>
                  <Badge variant={statusVariant[sub.status] ?? "default"}>
                    {sub.status.replace("_", " ")}
                  </Badge>
                </View>
                <Text className="text-xs text-muted-foreground mt-0.5">{sub.category}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-foreground">
                  ${sub.cost.toLocaleString()}{sub.perUnit.includes("user") ? `/${sub.perUnit}` : "/mo"}
                </Text>
                <Text className="text-xs text-muted-foreground">Renews {sub.renewal}</Text>
              </View>
            </Pressable>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
