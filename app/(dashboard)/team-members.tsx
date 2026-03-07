import { View, Text, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card, CardHeader, CardContent, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";

const members = [
  { id: "1", name: "John Doe", email: "john@company.com", role: "Owner", status: "active", lastActive: "Just now" },
  { id: "2", name: "Sarah Miller", email: "sarah@company.com", role: "Admin", status: "active", lastActive: "2 hours ago" },
  { id: "3", name: "Alex Chen", email: "alex@company.com", role: "Member", status: "active", lastActive: "1 day ago" },
  { id: "4", name: "Emily Brown", email: "emily@company.com", role: "Member", status: "active", lastActive: "3 hours ago" },
  { id: "5", name: "Mike Johnson", email: "mike@company.com", role: "Viewer", status: "invited", lastActive: "—" },
];

const roleColors: Record<string, string> = {
  Owner: "default",
  Admin: "secondary",
  Member: "outline",
  Viewer: "outline",
};

export default function TeamMembersView() {
  return (
    <ScrollView className="flex-1 bg-muted" contentContainerStyle={{ padding: 16 }}>
      <View className="flex-row items-center justify-between mb-4">
        <View />
        <Button size="sm">
          <View className="flex-row items-center gap-1.5">
            <Feather name="user-plus" size={14} color="#fff" />
            <Text className="text-xs font-medium text-white">Invite Member</Text>
          </View>
        </Button>
      </View>

      <Card className="mb-6">
        <CardHeader><CardTitle>Team Members</CardTitle></CardHeader>
        <CardContent className="gap-0 p-0">
          {members.map((member, idx) => (
            <View key={member.id} className={`px-4 py-3.5 flex-row items-center gap-3 ${idx < members.length - 1 ? "border-b border-border" : ""}`}>
              <Avatar fallback={member.name.split(" ").map(n => n[0]).join("")} />
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-foreground">{member.name}</Text>
                  <Badge variant={roleColors[member.role] as any}>{member.role}</Badge>
                  {member.status === "invited" && <Badge variant="warning">Invited</Badge>}
                </View>
                <Text className="text-xs text-muted-foreground">{member.email}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">{member.lastActive}</Text>
            </View>
          ))}
        </CardContent>
      </Card>
    </ScrollView>
  );
}
