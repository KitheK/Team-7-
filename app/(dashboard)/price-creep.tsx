import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const priceChanges = [
  { id: "1", vendor: "Zoom", original: 14.99, current: 18.99, increase: 26.7, detected: "Feb 2026", category: "Communication", action: "negotiate" },
  { id: "2", vendor: "Slack", original: 10.00, current: 12.50, increase: 25.0, detected: "Jan 2026", category: "Communication", action: "review" },
  { id: "3", vendor: "GitHub", original: 19.00, current: 21.00, increase: 10.5, detected: "Dec 2025", category: "Development", action: "accepted" },
  { id: "4", vendor: "Jira", original: 7.00, current: 7.75, increase: 10.7, detected: "Nov 2025", category: "Project Mgmt", action: "review" },
  { id: "5", vendor: "HubSpot", original: 45.00, current: 50.00, increase: 11.1, detected: "Mar 2026", category: "Marketing", action: "negotiate" },
];

const actionVariant: Record<string, "destructive" | "warning" | "success"> = {
  negotiate: "destructive",
  review: "warning",
  accepted: "success",
};

export default function PriceCreepView() {
  const totalImpact = priceChanges.reduce((sum, p) => sum + (p.current - p.original), 0);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      {/* Header Stats */}
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Price Increases Found</Text>
            <Text className="text-2xl font-bold text-foreground">{priceChanges.length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Monthly Impact</Text>
            <Text className="text-2xl font-bold text-destructive">+${totalImpact.toFixed(2)}</Text>
          </CardContent>
        </Card>
      </View>

      {/* Alert */}
      <Card className="mb-4 border-warning">
        <CardContent className="p-4 flex-row items-center gap-3">
          <View className="w-10 h-10 bg-warning/10 rounded-lg items-center justify-center">
            <Feather name="alert-triangle" size={20} color="#F59E0B" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-foreground">Active Monitoring</Text>
            <Text className="text-xs text-muted-foreground">Tracking price changes across 47 subscriptions. 2 require immediate action.</Text>
          </View>
        </CardContent>
      </Card>

      {/* Price Changes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detected Price Increases</CardTitle>
        </CardHeader>
        <CardContent className="gap-0 p-0">
          {priceChanges.map((item, idx) => (
            <View key={item.id} className={`px-4 py-3.5 ${idx < priceChanges.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 bg-destructive/10 rounded-lg items-center justify-center">
                    <Text className="text-xs font-bold text-destructive">{item.vendor.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{item.vendor}</Text>
                    <Text className="text-xs text-muted-foreground">{item.category}</Text>
                  </View>
                </View>
                <Badge variant={actionVariant[item.action]}>
                  {item.action}
                </Badge>
              </View>
              <View className="flex-row items-center gap-4 ml-10">
                <View>
                  <Text className="text-xs text-muted-foreground">Original</Text>
                  <Text className="text-sm text-foreground">${item.original.toFixed(2)}</Text>
                </View>
                <Feather name="arrow-right" size={14} color="#94A3B8" />
                <View>
                  <Text className="text-xs text-muted-foreground">Current</Text>
                  <Text className="text-sm font-semibold text-destructive">${item.current.toFixed(2)}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">Increase</Text>
                  <Text className="text-sm font-semibold text-destructive">+{item.increase}%</Text>
                </View>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
