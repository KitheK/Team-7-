import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { useState } from "react";

const vendors = [
  { id: "1", name: "Amazon Web Services", category: "Infrastructure", contact: "enterprise@aws.amazon.com", contractEnd: "Jun 2026", spend: 4500, status: "active" },
  { id: "2", name: "Salesforce", category: "CRM", contact: "support@salesforce.com", contractEnd: "Jul 2026", spend: 3000, status: "active" },
  { id: "3", name: "Slack (Salesforce)", category: "Communication", contact: "billing@slack.com", contractEnd: "Mar 2026", spend: 1125, status: "active" },
  { id: "4", name: "Zoom", category: "Communication", contact: "accounts@zoom.us", contractEnd: "Mar 2026", spend: 950, status: "under_review" },
  { id: "5", name: "GitHub", category: "Development", contact: "sales@github.com", contractEnd: "Apr 2026", spend: 630, status: "active" },
  { id: "6", name: "Datadog", category: "Monitoring", contact: "billing@datadoghq.com", contractEnd: "Sep 2026", spend: 640, status: "active" },
  { id: "7", name: "Figma", category: "Design", contact: "sales@figma.com", contractEnd: "May 2026", spend: 180, status: "active" },
  { id: "8", name: "Notion", category: "Productivity", contact: "team@notion.so", contractEnd: "—", spend: 0, status: "cancelled" },
];

export default function VendorDirectoryView() {
  const [search, setSearch] = useState("");
  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1">
          <Input placeholder="Search vendors..." value={search} onChangeText={setSearch} />
        </View>
      </View>

      <Card className="mb-6">
        <CardContent className="p-0">
          {filtered.map((vendor, idx) => (
            <Pressable key={vendor.id} className={`px-4 py-3.5 ${idx < filtered.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center">
                    <Text className="text-sm font-bold text-primary">{vendor.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{vendor.name}</Text>
                    <Text className="text-xs text-muted-foreground">{vendor.category}</Text>
                  </View>
                </View>
                <Badge variant={vendor.status === "active" ? "success" : vendor.status === "cancelled" ? "destructive" : "warning"}>
                  {vendor.status.replace("_", " ")}
                </Badge>
              </View>
              <View className="flex-row gap-4 ml-13 mt-1">
                <View className="flex-row items-center gap-1">
                  <Feather name="mail" size={12} color="#94A3B8" />
                  <Text className="text-xs text-muted-foreground">{vendor.contact}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Feather name="calendar" size={12} color="#94A3B8" />
                  <Text className="text-xs text-muted-foreground">{vendor.contractEnd}</Text>
                </View>
                {vendor.spend > 0 && (
                  <Text className="text-xs font-medium text-foreground">${vendor.spend.toLocaleString()}/mo</Text>
                )}
              </View>
            </Pressable>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
