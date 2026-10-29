/**
 * ORION-9 TOP HEADER COMPONENT
 * Enterprise status header with brand identity, environment pill, and notification badge.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { useAuth } from '../features/auth';
import { useAlerts } from '../features/alerts';
import { useData } from '../features/control-tower';
import { Badge } from './Badge';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  badgeLabel?: string;
  badgeVariant?: 'solid' | 'subtle' | 'outline' | 'critical' | 'high' | 'warning' | 'info' | 'success' | 'default';
  rightAction?:
    | React.ReactNode
    | {
        icon: keyof typeof Ionicons.glyphMap;
        onPress: () => void;
        accessibilityLabel?: string;
      };
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  badgeLabel,
  badgeVariant = 'info',
  rightAction,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { environment } = useAuth();
  const { isOffline } = useData();
  const { unreadCount } = useAlerts();

  const isLive = environment === 'LIVE';

  const renderRightAction = () => {
    if (!rightAction) {
      return (
        <View style={styles.rightGroup}>
          <View
            style={[
              styles.envPill,
              isLive ? styles.envPillLive : styles.envPillDemo,
            ]}
          >
            <View
              style={[
                styles.envDot,
                { backgroundColor: isLive ? Colors.status.success.solid : Colors.status.high.solid },
              ]}
            />
            <Text style={styles.envText}>{environment}</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/alerts')}
            style={styles.alertButton}
            hitSlop={Layout.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`Alerts, ${unreadCount} unread`}
          >
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (React.isValidElement(rightAction)) {
      return rightAction;
    }

    const action = rightAction as {
      icon: keyof typeof Ionicons.glyphMap;
      onPress: () => void;
      accessibilityLabel?: string;
    };

    return (
      <TouchableOpacity
        onPress={action.onPress}
        style={styles.actionIconButton}
        hitSlop={Layout.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={action.accessibilityLabel}
      >
        <Ionicons name={action.icon} size={22} color={Colors.cyan[400]} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.xs }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack || (() => router.back())}
            style={styles.backButton}
            hitSlop={Layout.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandContainer}>
            <View style={styles.logoMark}>
              <Ionicons name="hardware-chip" size={16} color={Colors.cyan[400]} />
            </View>
          </View>
        )}

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {title || 'ORION-9'}
            </Text>
            {badgeLabel && (
              <Badge
                label={badgeLabel}
                variant={badgeVariant as any}
                size="sm"
              />
            )}
          </View>
          {subtitle && (
            <Text style={styles.subtitleText} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {renderRightAction()}
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={14} color={Colors.status.high.text} />
          <Text style={styles.offlineText}>
            Offline Telemetry Mode • Displaying cached operational state
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  content: {
    height: Layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  titleText: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacings.wider,
  },
  subtitleText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  envPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  envPillDemo: {
    backgroundColor: Colors.environment.demo.badgeBg,
    borderColor: Colors.environment.demo.badgeBorder,
  },
  envPillLive: {
    backgroundColor: Colors.environment.live.badgeBg,
    borderColor: Colors.environment.live.badgeBorder,
  },
  envDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  envText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacings.wide,
  },
  alertButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.status.critical.solid,
    borderRadius: BorderRadius.round,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    fontSize: 9,
    fontWeight: Typography.fontWeights.bold,
    color: '#ffffff',
  },
  offlineBanner: {
    backgroundColor: Colors.status.high.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.status.high.border,
  },
  offlineText: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.status.high.text,
  },
});
