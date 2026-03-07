import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking…');

  useEffect(() => {
    async function check() {
      const { error } = await supabase.auth.getSession();
      setSupabaseStatus(error ? `Error: ${error.message}` : 'Supabase: connected');
    }
    check();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <Text style={styles.status}>{supabaseStatus}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
