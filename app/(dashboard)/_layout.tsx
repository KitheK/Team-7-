import { Drawer } from "expo-router/drawer";
import { TopNav } from "../../components/navigation/TopNav";
import { SidebarNav } from "../../components/navigation/SidebarNav";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DrawerActions } from "@react-navigation/native";

function CustomDrawerContent(props: any) {
  return <SidebarNav onClose={() => props.navigation.closeDrawer()} />;
}

function formatRouteName(name: string) {
  if (name === "index") return "Overview";
  return name
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DashboardLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          header: ({ route, navigation }) => (
            <TopNav
              title={formatRouteName(route.name)}
              onMenuPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            />
          ),
          drawerStyle: { width: 280 },
        }}
      >
        <Drawer.Screen name="index" options={{ title: "Overview" }} />
        <Drawer.Screen name="subscriptions" options={{ title: "Subscriptions" }} />
        <Drawer.Screen name="ai-insights" options={{ title: "AI Insights" }} />
        <Drawer.Screen name="savings" options={{ title: "Savings" }} />
        <Drawer.Screen name="price-creep" options={{ title: "Price Creep" }} />
        <Drawer.Screen name="spend-categories" options={{ title: "Spend Categories" }} />
        <Drawer.Screen name="vendor-analytics" options={{ title: "Vendor Analytics" }} />
        <Drawer.Screen name="vendor-negotiations" options={{ title: "Vendor Negotiations" }} />
        <Drawer.Screen name="vendor-directory" options={{ title: "Vendor Directory" }} />
        <Drawer.Screen name="automated-cancellation" options={{ title: "Automated Cancellation" }} />
        <Drawer.Screen name="ai-recommendations" options={{ title: "AI Recommendations" }} />
        <Drawer.Screen name="email-automation" options={{ title: "Email Automation" }} />
        <Drawer.Screen name="ai-call-settings" options={{ title: "AI Call Settings" }} />
        <Drawer.Screen name="roi-tracker" options={{ title: "ROI Tracker" }} />
        <Drawer.Screen name="savings-timeline" options={{ title: "Savings Timeline" }} />
        <Drawer.Screen name="impact-reports" options={{ title: "Impact Reports" }} />
        <Drawer.Screen name="billing-overview" options={{ title: "Billing Overview" }} />
        <Drawer.Screen name="contracts" options={{ title: "Contracts" }} />
        <Drawer.Screen name="integrations" options={{ title: "Integrations" }} />
        <Drawer.Screen name="team-members" options={{ title: "Team Members" }} />
        <Drawer.Screen name="security" options={{ title: "Security" }} />
        <Drawer.Screen name="notifications" options={{ title: "Notifications" }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
