import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Jost_400Regular, Jost_500Medium, Jost_700Bold } from '@expo-google-fonts/jost';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
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

function AppInner() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const c = useColors();
  const { isDark } = useTheme();

  const renderPage = () => {
    if (activeNav === 'Spending') return <SpendingContent />;
    if (activeNav === 'Savings') return <AlertsContent />;
    return <DashboardContent onOpenMonth={() => setActiveNav('Spending')} />;
  };

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
              onLogout={async () => { await supabase?.auth.signOut(); setDemoMode(false); setActiveNav('Home'); }}
              userEmail={session?.user?.email ?? 'demo@alfredio.com'}
            >
              {renderPage()}
            </AppLayout>
          </View>
        </LayoutProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </WorkspaceProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_700Bold,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator size="large" color="#E77449" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fontLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEBE8' },
});
