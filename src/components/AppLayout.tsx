import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Colors } from '../constants/colors';

type Props = {
  activeNav: string;
  onItemPress: (label: string) => void;
  onLogout: () => void;
  userEmail?: string;
  children: React.ReactNode;
};

export default function AppLayout({
  activeNav,
  onItemPress,
  onLogout,
  userEmail,
  children,
}: Props) {
  return (
    <View style={styles.root}>
      <Sidebar
        activeItem={activeNav}
        onItemPress={onItemPress}
        onLogout={onLogout}
      />
      <View style={styles.main}>
        <TopBar
          userName={userEmail?.split('@')[0] ?? 'User'}
          userRole="Finance Director"
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
});
