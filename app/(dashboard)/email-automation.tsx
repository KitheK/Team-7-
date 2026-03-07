import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Switch } from "../../components/ui/Switch";
import { useState } from "react";

const templates = [
  { id: "1", name: "Price Negotiation Request", type: "negotiation", enabled: true, sent: 12, responses: 8, successRate: 67 },
  { id: "2", name: "Contract Renewal Inquiry", type: "renewal", enabled: true, sent: 5, responses: 4, successRate: 80 },
  { id: "3", name: "Cancellation Notice", type: "cancellation", enabled: true, sent: 3, responses: 3, successRate: 100 },
  { id: "4", name: "Discount Request", type: "discount", enabled: false, sent: 8, responses: 3, successRate: 38 },
  { id: "5", name: "Downgrade Request", type: "downgrade", enabled: true, sent: 4, responses: 2, successRate: 50 },
];

const recentEmails = [
  { id: "1", vendor: "Zoom", subject: "Price Negotiation Request", status: "replied", date: "Mar 5, 2026" },
  { id: "2", vendor: "HubSpot", subject: "Discount Request", status: "sent", date: "Mar 4, 2026" },
  { id: "3", vendor: "Slack", subject: "Contract Renewal Inquiry", status: "replied", date: "Mar 3, 2026" },
  { id: "4", vendor: "Notion", subject: "Cancellation Notice", status: "confirmed", date: "Mar 2, 2026" },
];

export default function EmailAutomationView() {
  const [templateStates, setTemplateStates] = useState(
    Object.fromEntries(templates.map((t) => [t.id, t.enabled]))
  );

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row gap-3 mb-4">
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Emails Sent</Text>
            <Text className="text-2xl font-bold text-foreground">{templates.reduce((s, t) => s + t.sent, 0)}</Text>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Text className="text-xs text-muted-foreground">Response Rate</Text>
            <Text className="text-2xl font-bold text-foreground">63%</Text>
          </CardContent>
        </Card>
      </View>

      <Card className="mb-4">
        <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {templates.map((tpl, idx) => (
            <View key={tpl.id} className={`px-4 py-3.5 flex-row items-center justify-between ${idx < templates.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{tpl.name}</Text>
                <Text className="text-xs text-muted-foreground">{tpl.sent} sent · {tpl.responses} responses · {tpl.successRate}% success</Text>
              </View>
              <Switch
                value={templateStates[tpl.id]}
                onValueChange={(v) => setTemplateStates((s) => ({ ...s, [tpl.id]: v }))}
              />
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Recent Outreach</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {recentEmails.map((email, idx) => (
            <View key={email.id} className={`px-4 py-3 flex-row items-center gap-3 ${idx < recentEmails.length - 1 ? "border-b border-border" : ""}`}>
              <View className="w-8 h-8 bg-primary-50 rounded-full items-center justify-center">
                <Feather name="mail" size={14} color="#6366F1" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">{email.vendor}</Text>
                <Text className="text-xs text-muted-foreground">{email.subject}</Text>
              </View>
              <View className="items-end">
                <Badge variant={email.status === "replied" ? "success" : email.status === "confirmed" ? "success" : "default"}>
                  {email.status}
                </Badge>
                <Text className="text-xs text-muted-foreground mt-0.5">{email.date}</Text>
              </View>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
