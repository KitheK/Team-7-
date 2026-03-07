import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";

const topVendors = [
  { name: "AWS", spend: 4500, percentage: 30, trend: "+5%", category: "Infrastructure" },
  { name: "Salesforce", spend: 3000, percentage: 20, trend: "+2%", category: "CRM" },
  { name: "Slack", spend: 1125, percentage: 8, trend: "-3%", category: "Communication" },
  { name: "GitHub", spend: 630, percentage: 4, trend: "+10%", category: "Development" },
  { name: "Zoom", spend: 950, percentage: 6, trend: "+15%", category: "Communication" },
  { name: "Figma", spend: 180, percentage: 1, trend: "0%", category: "Design" },
];

const vendorHealth = [
  { label: "Excellent", count: 12, color: "#22C55E" },
  { label: "Good", count: 18, color: "#3B82F6" },
  { label: "Fair", count: 10, color: "#F59E0B" },
  { label: "Poor", count: 7, color: "#EF4444" },
];

export default function VendorAnalyticsView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Total Vendors</Text>
            <Text className="text-2xl font-bold text-foreground">47</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Avg Vendor Cost</Text>
            <Text className="text-2xl font-bold text-foreground">$521</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Vendor Health Score</CardTitle>
        </CardHeader>
        <CardContent className="flex-row gap-3">
          {vendorHealth.map((h) => (
            <View key={h.label} className="flex-1 items-center p-3 bg-muted rounded-lg">
              <Text className="text-lg font-bold" style={{ color: h.color }}>{h.count}</Text>
              <Text className="text-xs text-muted-foreground">{h.label}</Text>
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Top Vendors by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-end gap-2 h-32 mb-4">
            {topVendors.slice(0, 5).map((v) => (
              <View key={v.name} className="flex-1 items-center">
                <View className="w-full bg-primary rounded-t-md" style={{ height: (v.spend / 5000) * 120 }} />
                <Text className="text-xs text-muted-foreground mt-1">{v.name}</Text>
              </View>
            ))}
          </View>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
        </CardHeader>
        <CardContent className="gap-3 p-0">
          {topVendors.map((v, idx) => (
            <View key={v.name} className={`flex-row items-center justify-between px-4 py-3 ${idx < topVendors.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 bg-primary-50 rounded-lg items-center justify-center">
                  <Text className="text-xs font-bold text-primary">{v.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-foreground">{v.name}</Text>
                  <Text className="text-xs text-muted-foreground">{v.category}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-foreground">${v.spend.toLocaleString()}/mo</Text>
                <Text className={`text-xs ${v.trend.startsWith("+") ? "text-destructive" : v.trend.startsWith("-") ? "text-success" : "text-muted-foreground"}`}>{v.trend}</Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
