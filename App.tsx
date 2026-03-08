import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { WorkspaceProvider } from './src/context/WorkspaceContext';
import { LayoutProvider } from './src/context/LayoutContext';
import { ThemeProvider, useColors, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import AppLayout from './src/components/AppLayout';
import DashboardContent from './src/screens/DashboardContent';
import SpendingContent from './src/screens/SpendingContent';
import AlertsContent from './src/screens/AlertsContent';
import WhatIfContent from './src/screens/WhatIfContent';

const PAGE_CONTENT: Record<string, React.ReactNode> = {
  Dashboard: <DashboardContent />,
  Spending: <SpendingContent />,
  Alerts: <AlertsContent />,
  'What If': <WhatIfContent />,
};

function AppInner() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const c = useColors();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 5000);
    supabase.auth.getSession()
      .then(({ data: { session } }) => setSession(session))
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  if (!session && !demoMode) {
    return (
      <SafeAreaProvider>
        <LoginScreen onDemoPress={() => setDemoMode(true)} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <WorkspaceProvider userId={session?.user?.id ?? null} isDemoMode={demoMode}>
        <LayoutProvider>
          <View style={styles.root}>
            <AppLayout
              activeNav={activeNav}
              onItemPress={setActiveNav}
              onLogout={async () => { await supabase?.auth.signOut(); setDemoMode(false); setActiveNav('Dashboard'); }}
              userEmail={session?.user?.email ?? 'demo@leanledger.com'}
            >
              {PAGE_CONTENT[activeNav] ?? <DashboardContent />}
            </AppLayout>
          </View>
        </LayoutProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
