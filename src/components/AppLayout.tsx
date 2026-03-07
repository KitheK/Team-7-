import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Colors } from '../constants/colors';
import { useWorkspace, workspaceLabel, OVERVIEW_ID, type OverviewRange } from '../context/WorkspaceContext';
import { useLayout } from '../context/LayoutContext';

type Props = {
  activeNav: string;
  onItemPress: (label: string) => void;
  onLogout: () => void;
  userEmail?: string;
  children: React.ReactNode;
};

const SIDEBAR_WIDTH = 200;
const SIDEBAR_WIDTH_MOBILE = 280;
const isIOS = Platform.OS === 'ios';

export default function AppLayout({
  activeNav,
  onItemPress,
  onLogout,
  userEmail,
  children,
}: Props) {
  const { isMobile, isNative } = useLayout();
  const [sidebarOpen, setSidebarOpen] = useState(!isNative && !isMobile);
  const insets = useSafeAreaInsets();
  const { activeWorkspaceId, activeWorkspace, overviewRange } = useWorkspace();
  const rangeLabel: Record<OverviewRange, string> = { all: 'All months', last3: 'Last 3 months', last6: 'Last 6 months' };
  const viewingLabel = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId
    ? rangeLabel[overviewRange]
    : activeWorkspace
      ? workspaceLabel(activeWorkspace)
      : 'All months';

  useEffect(() => {
    if (isNative) setSidebarOpen(false);
    else if (!isMobile) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isMobile, isNative]);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleNavPress = (key: string) => {
    onItemPress(key);
    if (isNative || isMobile) closeSidebar();
  };

  const sidebarContent = (
    <Sidebar
      activeItem={activeNav}
      onItemPress={handleNavPress}
      onLogout={onLogout}
      onClose={isNative || isMobile ? closeSidebar : undefined}
    />
  );

  if (isNative) {
    return (
      <View style={styles.root}>
        <Modal
          visible={sidebarOpen}
          animationType="slide"
          transparent
          onRequestClose={closeSidebar}
          statusBarTranslucent
        >
          <Pressable style={styles.drawerBackdrop} onPress={closeSidebar}>
            <Pressable
              style={[styles.drawerPane, { width: SIDEBAR_WIDTH_MOBILE }]}
              onPress={e => e.stopPropagation()}
            >
              <SafeAreaView style={styles.drawerSafe} edges={['top', 'bottom']}>
                {sidebarContent}
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>

        <SafeAreaView style={styles.nativeSafe} edges={['top', 'left', 'right']}>
          <TopBar
            userName={userEmail?.split('@')[0] ?? 'User'}
            userRole="Finance Director"
            viewingLabel={viewingLabel}
            sidebarOpen={sidebarOpen}
            onMenuPress={toggleSidebar}
            isNative={true}
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, styles.scrollContentNative, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
            showsVerticalScrollIndicator={true}
            bounces={true}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Web layout (completely unchanged from original behavior)
  return (
    <View style={styles.root}>
      {isMobile ? (
        <Modal
          visible={sidebarOpen}
          animationType="slide"
          transparent
          onRequestClose={closeSidebar}
        >
          <Pressable style={styles.drawerBackdrop} onPress={closeSidebar}>
            <Pressable
              style={[styles.drawerPane, { width: SIDEBAR_WIDTH_MOBILE }]}
              onPress={e => e.stopPropagation()}
            >
              {sidebarContent}
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        <View style={[styles.sidebarWrap, { width: sidebarOpen ? SIDEBAR_WIDTH : 0 }]}>
          {sidebarContent}
        </View>
      )}
      <View style={styles.main}>
        <TopBar
          userName={userEmail?.split('@')[0] ?? 'User'}
          userRole="Finance Director"
          viewingLabel={viewingLabel}
          sidebarOpen={sidebarOpen}
          onMenuPress={toggleSidebar}
          isNative={false}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
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
  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },
  drawerPane: {
    height: '100%',
    backgroundColor: Colors.sidebar,
  },
  drawerSafe: {
    flex: 1,
  },
  nativeSafe: {
    flex: 1,
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
  scrollContentMobile: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentNative: {
    padding: 16,
    paddingBottom: 40,
  },
});
