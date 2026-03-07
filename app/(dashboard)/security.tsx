import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { Separator } from "../../components/ui/Separator";
import { useState } from "react";

const sessions = [
  { id: "1", device: "Chrome on Windows", location: "New York, US", lastActive: "Current session", current: true },
  { id: "2", device: "Safari on iPhone", location: "New York, US", lastActive: "2 hours ago", current: false },
  { id: "3", device: "Firefox on MacOS", location: "San Francisco, US", lastActive: "1 day ago", current: false },
];

const auditLog = [
  { id: "1", action: "Login", user: "john@company.com", date: "Mar 7, 2026 10:30 AM", ip: "192.168.1.1" },
  { id: "2", action: "Settings Updated", user: "sarah@company.com", date: "Mar 7, 2026 9:15 AM", ip: "192.168.1.2" },
  { id: "3", action: "Member Invited", user: "john@company.com", date: "Mar 6, 2026 4:20 PM", ip: "192.168.1.1" },
  { id: "4", action: "Integration Connected", user: "alex@company.com", date: "Mar 6, 2026 2:00 PM", ip: "192.168.1.3" },
];

export default function SecurityView() {
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionAlerts, setSessionAlerts] = useState(true);

  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Two-Factor Authentication</Text>
              <Text className="text-xs text-muted-foreground">Add an extra layer of security to your account</Text>
            </View>
            <Switch value={twoFactor} onValueChange={setTwoFactor} />
          </View>
          <Separator />
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Session Alerts</Text>
              <Text className="text-xs text-muted-foreground">Get notified of new login sessions</Text>
            </View>
            <Switch value={sessionAlerts} onValueChange={setSessionAlerts} />
          </View>
          <Separator />
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-medium text-foreground">Password</Text>
              <Text className="text-xs text-muted-foreground">Last changed 30 days ago</Text>
            </View>
            <Button variant="outline" size="sm"><Text className="text-xs font-medium text-foreground">Change</Text></Button>
          </View>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {sessions.map((s, idx) => (
            <View key={s.id} className={`px-4 py-3 flex-row items-center gap-3 ${idx < sessions.length - 1 ? "border-b border-border" : ""}`}>
              <Feather name="monitor" size={18} color="#64748B" />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-foreground">{s.device}</Text>
                  {s.current && <Badge variant="success">Current</Badge>}
                </View>
                <Text className="text-xs text-muted-foreground">{s.location} · {s.lastActive}</Text>
              </View>
              {!s.current && (
                <Button variant="ghost" size="sm"><Text className="text-xs text-destructive">Revoke</Text></Button>
              )}
            </View>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {auditLog.map((log, idx) => (
            <View key={log.id} className={`px-4 py-3 ${idx < auditLog.length - 1 ? "border-b border-border" : ""}`}>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">{log.action}</Text>
                <Text className="text-xs text-muted-foreground">{log.date}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">{log.user} · IP: {log.ip}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
