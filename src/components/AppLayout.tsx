import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Colors } from '../constants/colors';
import { useWorkspace, workspaceLabel, OVERVIEW_ID, type OverviewRange } from '../context/WorkspaceContext';

type Props = {
  activeNav: string;
  onItemPress: (label: string) => void;
  onLogout: () => void;
  userEmail?: string;
  children: React.ReactNode;
};

const SIDEBAR_WIDTH = 200;

export default function AppLayout({
  activeNav,
  onItemPress,
  onLogout,
  userEmail,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { activeWorkspaceId, activeWorkspace, overviewRange } = useWorkspace();
  const rangeLabel: Record<OverviewRange, string> = { all: 'All months', last3: 'Last 3 months', last6: 'Last 6 months' };
  const viewingLabel = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId
    ? rangeLabel[overviewRange]
    : activeWorkspace
      ? workspaceLabel(activeWorkspace)
      : 'All months';

  return (
    <View style={styles.root}>
      <View style={[styles.sidebarWrap, { width: sidebarOpen ? SIDEBAR_WIDTH : 0 }]}>
        <Sidebar
          activeItem={activeNav}
          onItemPress={onItemPress}
          onLogout={onLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </View>
      <View style={styles.main}>
        <TopBar
          userName={userEmail?.split('@')[0] ?? 'User'}
          userRole="Finance Director"
          viewingLabel={viewingLabel}
          sidebarOpen={sidebarOpen}
          onMenuPress={() => setSidebarOpen(prev => !prev)}
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
  sidebarWrap: {
    overflow: 'hidden',
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
