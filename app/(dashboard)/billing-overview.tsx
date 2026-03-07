import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Separator } from "../../components/ui/Separator";

const paymentHistory = [
  { id: "1", date: "Mar 1, 2026", amount: 299, status: "paid", method: "Visa •••• 4242" },
  { id: "2", date: "Feb 1, 2026", amount: 299, status: "paid", method: "Visa •••• 4242" },
  { id: "3", date: "Jan 1, 2026", amount: 299, status: "paid", method: "Visa •••• 4242" },
  { id: "4", date: "Dec 1, 2025", amount: 299, status: "paid", method: "Visa •••• 4242" },
];

export default function BillingOverviewView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-foreground">Business Pro</Text>
                <Badge variant="default">Active</Badge>
              </View>
              <Text className="text-sm text-muted-foreground mt-1">$299/month · Billed monthly</Text>
            </View>
            <Button variant="outline" size="sm"><Text className="text-xs font-medium text-foreground">Change Plan</Text></Button>
          </View>
          <Separator className="my-3" />
          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-muted-foreground">Next billing date</Text>
              <Text className="text-sm font-medium text-foreground">Apr 1, 2026</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Subscriptions tracked</Text>
              <Text className="text-sm font-medium text-foreground">47 / 100</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Team seats</Text>
              <Text className="text-sm font-medium text-foreground">5 / 10</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-muted rounded-lg items-center justify-center">
                <Feather name="credit-card" size={20} color="#64748B" />
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground">Visa ending in 4242</Text>
                <Text className="text-xs text-muted-foreground">Expires 12/2027</Text>
              </View>
            </View>
            <Button variant="ghost" size="sm"><Text className="text-xs font-medium text-primary">Update</Text></Button>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {paymentHistory.map((p, idx) => (
            <View key={p.id} className={`px-4 py-3 flex-row items-center justify-between ${idx < paymentHistory.length - 1 ? "border-b border-border" : ""}`}>
              <View>
                <Text className="text-sm text-foreground">{p.date}</Text>
                <Text className="text-xs text-muted-foreground">{p.method}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-foreground">${p.amount}</Text>
                <Badge variant="success">{p.status}</Badge>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
