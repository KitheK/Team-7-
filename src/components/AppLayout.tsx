import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const isWeb = Platform.OS === 'web';
const gradientBgStyle = isWeb
  ? { flex: 1, backgroundImage: 'linear-gradient(to bottom, #EDEBE8 0%, #F0E2D8 65%, #EDD0C0 100%)' as const }
  : { flex: 1, backgroundColor: '#F0E2D8' };
import TopBar from './TopBar';
import MonthRangeSelector from './MonthRangeSelector';
import { useWorkspace, workspaceLabel, OVERVIEW_ID, type OverviewRange } from '../context/WorkspaceContext';
import { useLayout } from '../context/LayoutContext';
import theme from '../../constants/theme';
import Typography from './ui/Typography';

type Props = {
  activeNav: string;
  onItemPress: (label: string) => void;
  onLogout: () => void;
  userEmail?: string;
  children: React.ReactNode;
};

const MOBILE_ACTIONS = ['Home', 'Spending', 'Savings', 'Month'] as const;

export default function AppLayout({ activeNav, onItemPress, onLogout, userEmail, children }: Props) {
  const { isMobile, isNative } = useLayout();
  const [monthSelectorVisible, setMonthSelectorVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { activeWorkspaceId, activeWorkspace, overviewRange } = useWorkspace();
  const monthLabel = useMemo(() => {
    const rangeLabel: Record<OverviewRange, string> = {
      all: 'All months',
      last3: 'Last 3 months',
      last6: 'Last 6 months',
    };
    return activeWorkspaceId === OVERVIEW_ID || !activeWorkspaceId
      ? rangeLabel[overviewRange]
      : activeWorkspace
        ? workspaceLabel(activeWorkspace)
        : 'All months';
  }, [activeWorkspaceId, activeWorkspace, overviewRange]);

  const handlePrimaryAction = (action: string) => {
    if (action === 'Month') {
      setMonthSelectorVisible(true);
      return;
    }
    onItemPress(action);
  };

  const GradientBg = useMemo(() => (props: { style?: any; children: React.ReactNode }) => (
    <View style={[gradientBgStyle, props.style]}>{props.children}</View>
  ), []);

  if (isNative) {
    return (
      <GradientBg>
        <SafeAreaView style={styles.nativeSafe} edges={['top', 'left', 'right']}>
          <TopBar
            userName={userEmail?.split('@')[0] ?? 'User'}
            activeNav={activeNav}
            onNavPress={handlePrimaryAction}
            onMonthPress={() => setMonthSelectorVisible(true)}
            monthLabel={monthLabel}
            isNative
            onLogout={onLogout}
          />
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, styles.scrollNative, { paddingBottom: Math.max(insets.bottom, 64) + 44 }]} showsVerticalScrollIndicator bounces keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) }]}>
            {MOBILE_ACTIONS.map(action => {
              const selected = action === activeNav;
              const isMonthAction = action === 'Month';
              const iconName =
                action === 'Home' ? 'home' :
                action === 'Spending' ? 'bar-chart-2' :
                action === 'Savings' ? 'trending-down' :
                'calendar';
              const isActive = selected || (isMonthAction && monthSelectorVisible);
              const activeColor =
                action === 'Spending' ? theme.colors.primary :
                action === 'Savings' ? theme.colors.success :
                theme.colors.primary;
              return (
                <Pressable
                  key={action}
                  onPress={() => handlePrimaryAction(action)}
                  style={({ pressed, hovered }) => [
                    styles.bottomAction,
                    isActive && styles.bottomActionActive,
                    isActive && action === 'Savings' && styles.bottomActionActiveSavings,
                    hovered && styles.bottomActionHover,
                    pressed && styles.bottomActionPressed,
                  ]}
                >
                  <Feather
                    name={iconName}
                    size={18}
                    color={isActive ? activeColor : theme.colors.textSecondary}
                  />
                  <Typography
                    variant="caption"
                    style={isActive ? [styles.bottomActionTextActive, { color: activeColor }] : styles.bottomActionText}
                  >
                    {isMonthAction ? 'Months' : action}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
        <MonthRangeSelector visible={monthSelectorVisible} onClose={() => setMonthSelectorVisible(false)} isMobile />
      </GradientBg>
    );
  }

  return (
    <GradientBg>
      <View style={styles.main}>
        <TopBar
          userName={userEmail?.split('@')[0] ?? 'User'}
          activeNav={activeNav}
          onNavPress={handlePrimaryAction}
          onMonthPress={() => setMonthSelectorVisible(true)}
          monthLabel={monthLabel}
          isNative={false}
          onLogout={onLogout}
        />
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollMobile]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
      <MonthRangeSelector visible={monthSelectorVisible} onClose={() => setMonthSelectorVisible(false)} />
    </GradientBg>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  nativeSafe: {
    flex: 1,
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 64,
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
  },
  scrollMobile: {
    padding: theme.spacing.lg,
    paddingBottom: 112,
  },
  scrollNative: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: 104,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomAction: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    gap: 4,
  },
  bottomActionActive: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...theme.shadows.subtle,
  },
  bottomActionActiveSavings: {
    borderColor: theme.colors.success,
  },
  bottomActionHover: {
    transform: [{ translateY: -1 }],
  },
  bottomActionPressed: {
    transform: [{ scale: 0.99 }],
  },
  bottomActionText: {
    color: theme.colors.textSecondary,
  },
  bottomActionTextActive: {
    color: theme.colors.primary,
  },
});
