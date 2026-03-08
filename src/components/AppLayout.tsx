import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useColors } from '../context/ThemeContext';
import { useWorkspace, workspaceLabel, OVERVIEW_ID, type OverviewRange } from '../context/WorkspaceContext';
import { useLayout } from '../context/LayoutContext';

type Props = {
  activeNav: string;
  onItemPress: (label: string) => void;
  onLogout: () => void;
  userEmail?: string;
  children: React.ReactNode;
};

const SIDEBAR_WIDTH = 220;
const SIDEBAR_WIDTH_MOBILE = 280;

export default function AppLayout({ activeNav, onItemPress, onLogout, userEmail, children }: Props) {
  const { isMobile, isNative } = useLayout();
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const [sidebarOpen, setSidebarOpen] = useState(!isNative && !isMobile);
  const insets = useSafeAreaInsets();
  const { activeWorkspaceId, activeWorkspace, overviewRange } = useWorkspace();
  const rangeLabel: Record<OverviewRange, string> = { all: 'All months', last3: 'Last 3 months', last6: 'Last 6 months' };
  const viewingLabel = activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId
    ? rangeLabel[overviewRange]
    : activeWorkspace ? workspaceLabel(activeWorkspace) : 'All months';

  useEffect(() => {
    if (isNative) setSidebarOpen(false);
    else if (!isMobile) setSidebarOpen(true);
    else setSidebarOpen(false);
  }, [isMobile, isNative]);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(p => !p);
  const handleNavPress = (key: string) => {
    onItemPress(key);
    if (isNative || isMobile) closeSidebar();
  };

  const sidebar = (
    <Sidebar activeItem={activeNav} onItemPress={handleNavPress} onLogout={onLogout} onClose={isNative || isMobile ? closeSidebar : undefined} />
  );

  if (isNative) {
    return (
      <View style={s.root}>
        <Modal visible={sidebarOpen} animationType="slide" transparent onRequestClose={closeSidebar} statusBarTranslucent>
          <Pressable style={s.drawerBackdrop} onPress={closeSidebar}>
            <Pressable style={[s.drawerPane, { width: SIDEBAR_WIDTH_MOBILE }]} onPress={e => e.stopPropagation()}>
              <SafeAreaView style={s.drawerSafe} edges={['top', 'bottom']}>{sidebar}</SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
        <SafeAreaView style={s.nativeSafe} edges={['top', 'left', 'right']}>
          <TopBar userName={userEmail?.split('@')[0] ?? 'User'} userRole="" viewingLabel={viewingLabel} sidebarOpen={sidebarOpen} onMenuPress={toggleSidebar} isNative />
          <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, s.scrollNative, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]} showsVerticalScrollIndicator bounces keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {isMobile ? (
        <Modal visible={sidebarOpen} animationType="slide" transparent onRequestClose={closeSidebar}>
          <Pressable style={s.drawerBackdrop} onPress={closeSidebar}>
            <Pressable style={[s.drawerPane, { width: SIDEBAR_WIDTH_MOBILE }]} onPress={e => e.stopPropagation()}>
              {sidebar}
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        <View style={[s.sidebarWrap, { width: sidebarOpen ? SIDEBAR_WIDTH : 0 }]}>{sidebar}</View>
      )}
      <View style={s.main}>
        <TopBar userName={userEmail?.split('@')[0] ?? 'User'} userRole="" viewingLabel={viewingLabel} sidebarOpen={sidebarOpen} onMenuPress={toggleSidebar} isNative={false} />
        <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, isMobile && s.scrollMobile]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, flexDirection: 'row', backgroundColor: c.background },
    sidebarWrap: { overflow: 'hidden' },
    drawerBackdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-start' },
    drawerPane: { height: '100%', backgroundColor: c.sidebar },
    drawerSafe: { flex: 1 },
    nativeSafe: { flex: 1, backgroundColor: c.background },
    main: { flex: 1, overflow: 'hidden' },
    scroll: { flex: 1 },
    scrollContent: { padding: 28, paddingBottom: 48, maxWidth: 1100 },
    scrollMobile: { padding: 16, paddingBottom: 32 },
    scrollNative: { padding: 16, paddingBottom: 40 },
  });
}
