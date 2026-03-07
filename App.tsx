import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { WorkspaceProvider } from './src/context/WorkspaceContext';
import { LayoutProvider } from './src/context/LayoutContext';
import LoginScreen from './src/screens/LoginScreen';
import AppLayout from './src/components/AppLayout';
import DashboardContent from './src/screens/DashboardContent';
import SubscriptionsContent from './src/screens/SubscriptionsContent';
import PriceCreepContent from './src/screens/PriceCreepContent';
import SpendCategoriesContent from './src/screens/SpendCategoriesContent';
import VendorAnalyticsContent from './src/screens/VendorAnalyticsContent';
import VendorNegotiationsContent from './src/screens/VendorNegotiationsContent';
import AutomatedCancellationContent from './src/screens/AutomatedCancellationContent';
import AIRecommendationsContent from './src/screens/AIRecommendationsContent';
import SavingsContent from './src/screens/SavingsContent';
import { Colors } from './src/constants/colors';

const PAGE_CONTENT: Record<string, React.ReactNode> = {
  Dashboard: <DashboardContent />,
  Subscriptions: <SubscriptionsContent />,
  'Price Creep': <PriceCreepContent />,
  'Spend Categories': <SpendCategoriesContent />,
  'Vendor Analytics': <VendorAnalyticsContent />,
  'Vendor Negotiations': <VendorNegotiationsContent />,
  'Automated Cancellation': <AutomatedCancellationContent />,
  'AI Recommendations': <AIRecommendationsContent />,
  Savings: <SavingsContent />,
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <StatusBar style="dark" />
      </View>
    );
  }

  const isLoggedIn = session || demoMode;

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <LoginScreen onDemoPress={() => setDemoMode(true)} />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  const content = PAGE_CONTENT[activeNav] ?? <DashboardContent />;

  return (
    <SafeAreaProvider>
    <WorkspaceProvider
      userId={session?.user?.id ?? null}
      isDemoMode={demoMode}
    >
      <LayoutProvider>
        <View style={styles.root}>
          <AppLayout
          activeNav={activeNav}
          onItemPress={setActiveNav}
          onLogout={async () => { await supabase?.auth.signOut(); setActiveNav('Dashboard'); }}
          userEmail={session?.user?.email ?? 'demo@finoptima.com'}
        >
          {content}
        </AppLayout>
        </View>
      </LayoutProvider>
      <StatusBar style="dark" />
    </WorkspaceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
