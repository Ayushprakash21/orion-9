import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth';
import { Header, Card, Badge, ConfirmationModal, Button } from '../../src/components';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';

export default function AppsScreen() {
  const router = useRouter();
  const { session, environment, setEnvironment, signOut } = useAuth();

  const [desktopModal, setDesktopModal] = useState<{
    visible: boolean;
    moduleName: string;
    description: string;
  }>({
    visible: false,
    moduleName: '',
    description: '',
  });

  const [isSigningOut, setIsSigningOut] = useState(false);

  const nativeModules = [
    {
      id: 'control',
      title: 'Control Tower',
      description: 'Operational exception triage & mitigation',
      icon: 'shield-outline',
      route: '/(tabs)/control',
    },
    {
      id: 'inventory',
      title: 'Inventory Buffers',
      description: 'Stock levels, lead times & buffer deficits',
      icon: 'cube-outline',
      route: '/(tabs)/control?category=inventory',
    },
    {
      id: 'shipments',
      title: 'Freight & Convoys',
      description: 'Vessel tracking, port transit & delays',
      icon: 'boat-outline',
      route: '/(tabs)/control?category=shipments',
    },
    {
      id: 'suppliers',
      title: 'Supplier 360',
      description: 'OTIF fulfillment, quality & spend',
      icon: 'business-outline',
      route: '/(tabs)/control?category=suppliers',
    },
    {
      id: 'copilot',
      title: 'Orion AI Copilot',
      description: 'Grounded autonomous decision assistant',
      icon: 'hardware-chip-outline',
      route: '/(tabs)/ai',
    },
    {
      id: 'alerts',
      title: 'Incident Alerts',
      description: 'Push notifications & telemetry alerts',
      icon: 'notifications-outline',
      route: '/(tabs)/alerts',
    },
  ];

  const desktopModules = [
    {
      id: 'twin',
      title: 'Supply Chain Digital Twin',
      description: '3D multi-tier supply network topology simulation',
      icon: 'globe-outline',
      info: 'The Digital Twin engine requires high-performance GPU compute. Access via the Orion-9 Desktop Workstation application.',
    },
    {
      id: 'fabric',
      title: 'Event Fabric Kafka Pipeline',
      description: 'Low-latency distributed telemetry broker',
      icon: 'git-network-outline',
      info: 'Stream partition management and distributed pipeline administration are managed via the desktop infrastructure dashboard.',
    },
    {
      id: 'policy',
      title: 'Autonomous Rebalance Engine',
      description: 'Mixed-integer linear programming optimizer',
      icon: 'calculator-outline',
      info: 'Policy rebalance batch runs utilize the high-memory cluster optimizer available in the Orion-9 desktop client.',
    },
    {
      id: 'world-model',
      title: 'Global Scenario Simulator',
      description: 'Geopolitical disruption & port strike modeling',
      icon: 'planet-outline',
      info: 'Monte Carlo macro risk simulations are provisioned through the desktop Orion-9 compute engine.',
    },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleToggleEnvironment = async () => {
    const nextEnv = environment === 'DEMO' ? 'LIVE' : 'DEMO';
    await setEnvironment(nextEnv);
    Alert.alert(
      'Environment Switched',
      `Active environment switched to ${nextEnv}. Operational state re-indexed.`
    );
  };

  const displayName = session?.user.fullName || (environment === 'DEMO' ? 'Demo Operator' : 'Authenticated User');
  const displayRole = (session?.user.role || (environment === 'DEMO' ? 'OPERATOR' : 'USER')).replace(/_/g, ' ').toUpperCase();
  const displayDept = session?.user.department || (environment === 'DEMO' ? 'Autonomous Operations' : 'Supply Chain Operations');
  const displayTenant = session?.user.organizationName || session?.user.tenantId || (environment === 'DEMO' ? 'Orion Global Demo Network' : 'Orion Enterprise Network');
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="ORION-9 APPS"
        subtitle="System Modules & Account"
        badgeLabel="ENTERPRISE"
        badgeVariant="info"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials || 'O9'}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userRole}>
                {displayRole} • {displayDept}
              </Text>
              <Text style={styles.userTenant}>
                Tenant: {displayTenant}
              </Text>
            </View>
          </View>

          <View style={styles.envSwitchRow}>
            <View>
              <Text style={styles.envTitle}>ACTIVE ENVIRONMENT</Text>
              <Text style={styles.envSubtitle}>
                {environment === 'DEMO' ? 'Zero-Config Simulated Mode' : 'Connected to Orion-9 Cloud API'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.envSwitchButton}
              onPress={handleToggleEnvironment}
              accessibilityRole="button"
              accessibilityLabel={`Switch environment from ${environment}`}
            >
              <Badge
                label={environment}
                variant={environment === 'LIVE' ? 'success' : 'info'}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Mobile Native Modules */}
        <Text style={styles.sectionHeader}>MOBILE MODULES</Text>
        <View style={styles.gridContainer}>
          {nativeModules.map(mod => (
            <TouchableOpacity
              key={mod.id}
              style={styles.gridTile}
              onPress={() => router.push(mod.route as any)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${mod.title}`}
            >
              <View style={styles.tileIcon}>
                <Ionicons name={mod.icon as any} size={22} color={Colors.cyan[400]} />
              </View>
              <Text style={styles.tileTitle}>{mod.title}</Text>
              <Text style={styles.tileDescription}>{mod.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Desktop Handover Modules */}
        <Text style={styles.sectionHeader}>DESKTOP WORKSTATION MODULES</Text>
        <View style={styles.gridContainer}>
          {desktopModules.map(mod => (
            <TouchableOpacity
              key={mod.id}
              style={[styles.gridTile, styles.gridTileDesktop]}
              onPress={() =>
                setDesktopModal({
                  visible: true,
                  moduleName: mod.title,
                  description: mod.info,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`View desktop module ${mod.title}`}
            >
              <View style={styles.tileHeaderRow}>
                <View style={styles.tileIcon}>
                  <Ionicons name={mod.icon as any} size={22} color={Colors.textMuted} />
                </View>
                <Badge label="DESKTOP" variant="default" size="small" />
              </View>
              <Text style={styles.tileTitle}>{mod.title}</Text>
              <Text style={styles.tileDescription}>{mod.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security & Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out of Orion-9 Mobile"
            onPress={handleSignOut}
            variant="danger"
            loading={isSigningOut}
          />
          <Text style={styles.versionText}>
            Orion-9 Mobile Control Center • Version 1.0.0 (Build 2026.10)
          </Text>
        </View>
      </ScrollView>

      {/* Desktop Handover Modal */}
      <ConfirmationModal
        visible={desktopModal.visible}
        title={desktopModal.moduleName}
        description={desktopModal.description}
        confirmLabel="Understood"
        cancelLabel="Close"
        onConfirm={() => setDesktopModal(prev => ({ ...prev, visible: false }))}
        onCancel={() => setDesktopModal(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.cyan[400],
    letterSpacing: 0.5,
  },
  profileText: {
    flex: 1,
  },
  userName: {
    ...Typography.titleMedium,
    color: Colors.textPrimary,
  },
  userRole: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontWeight: '700',
    marginTop: 2,
  },
  userTenant: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  envSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  envTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  envSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  envSwitchButton: {
    padding: 4,
  },
  sectionHeader: {
    ...Typography.labelSmall,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  gridTile: {
    width: '48.5%',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 120,
  },
  gridTileDesktop: {
    backgroundColor: Colors.surfacePrimary,
    borderStyle: 'dashed',
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tileTitle: {
    ...Typography.titleSmall,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tileDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  signOutSection: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  versionText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
});
