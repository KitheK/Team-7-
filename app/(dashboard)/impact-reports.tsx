import { View, Text, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const reports = [
  { id: "1", title: "Q1 2026 Savings Report", date: "Mar 1, 2026", type: "quarterly", status: "ready", metrics: { saved: 8700, optimized: 15, cancelled: 4 } },
  { id: "2", title: "February 2026 Impact Summary", date: "Feb 28, 2026", type: "monthly", status: "ready", metrics: { saved: 3100, optimized: 6, cancelled: 1 } },
  { id: "3", title: "January 2026 Impact Summary", date: "Jan 31, 2026", type: "monthly", status: "ready", metrics: { saved: 2900, optimized: 5, cancelled: 2 } },
  { id: "4", title: "Q4 2025 Savings Report", date: "Dec 31, 2025", type: "quarterly", status: "ready", metrics: { saved: 6600, optimized: 12, cancelled: 3 } },
  { id: "5", title: "Annual 2025 Impact Report", date: "Dec 31, 2025", type: "annual", status: "ready", metrics: { saved: 12400, optimized: 28, cancelled: 8 } },
];

export default function ImpactReportsView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Total Reports</Text>
            <Text className="text-2xl font-bold text-foreground">{reports.length}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">All-Time Savings</Text>
            <Text className="text-2xl font-bold text-success">$33,700</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Download or view your impact reports</CardDescription>
        </CardHeader>
        <CardContent className="gap-0 p-0">
          {reports.map((report, idx) => (
            <Pressable key={report.id} className={`px-4 py-4 ${idx < reports.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-primary-50 rounded-lg items-center justify-center">
                    <Feather name="file-text" size={20} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-foreground">{report.title}</Text>
                    <Text className="text-xs text-muted-foreground">{report.date}</Text>
                  </View>
                </View>
                <Badge variant={report.type === "annual" ? "default" : report.type === "quarterly" ? "secondary" : "outline"}>
                  {report.type}
                </Badge>
              </View>
              <View className="flex-row gap-4 ml-13">
                <View>
                  <Text className="text-xs text-muted-foreground">Saved</Text>
                  <Text className="text-sm font-semibold text-success">${report.metrics.saved.toLocaleString()}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">Optimized</Text>
                  <Text className="text-sm font-semibold text-foreground">{report.metrics.optimized}</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted-foreground">Cancelled</Text>
                  <Text className="text-sm font-semibold text-foreground">{report.metrics.cancelled}</Text>
                </View>
                <View className="flex-1 items-end justify-center">
                  <Feather name="download" size={18} color="#6366F1" />
                </View>
              </View>
            </Pressable>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
