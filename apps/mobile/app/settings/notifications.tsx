import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header, Card, Button } from '../../src/components';
import { notifications } from '../../src/services/notifications';
import { useAuth } from '../../src/features/auth';
import { Colors, Typography, Spacing } from '../../src/theme';
import { UserNotificationPreferences } from '../../src/types';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [prefs, setPrefs] = useState<UserNotificationPreferences>({
    pushEnabled: true,
    criticalAlertsOnly: false,
    soundEnabled: true,
    shipmentDelayAlerts: true,
    inventoryStockoutAlerts: true,
    overduePoAlerts: true,
  });

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const load = async () => {
      const saved = await notifications.getUserPreferences(session?.user.id);
      setPrefs(saved);
    };
    load();
  }, [session?.user.id]);

  const updatePref = async (key: keyof UserNotificationPreferences, val: boolean) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await notifications.saveUserPreferences(updated, session?.user.id);
  };

  const handleRegisterToken = async () => {
    setIsRegistering(true);
    try {
      const token = await notifications.registerForPushNotifications();
      if (token) {
        setPushToken(token);
        Alert.alert('Device Registered', `Push token registered successfully.`);
      } else {
        Alert.alert(
          'Push Registration Notice',
          'Push notifications permissions not granted, or running in an environment without APNs/FCM capabilities.'
        );
      }
    } catch (err: any) {
      Alert.alert('Registration Error', err.message || 'Could not register push token.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestAlert = async () => {
    await notifications.sendLocalAlert(
      'Test Operational Alert',
      'This is a local verification of Orion-9 mobile alert handling.'
    );
    Alert.alert('Alert Dispatched', 'Local notification dispatched to device notification tray.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="NOTIFICATION SETTINGS"
        subtitle="Push & Alert Routing"
        showBack
        onBack={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>DEVICE CHANNELS</Text>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive remote APNs/FCM operational alerts
              </Text>
            </View>
            <Switch
              value={prefs.pushEnabled}
              onValueChange={v => updatePref('pushEnabled', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.pushEnabled ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Critical Alerts Only</Text>
              <Text style={styles.settingDescription}>
                Suppress Low & Medium severity telemetry
              </Text>
            </View>
            <Switch
              value={prefs.criticalAlertsOnly}
              onValueChange={v => updatePref('criticalAlertsOnly', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.criticalAlertsOnly ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound & Haptic Feedback</Text>
              <Text style={styles.settingDescription}>
                Audible chime on critical operational events
              </Text>
            </View>
            <Switch
              value={prefs.soundEnabled}
              onValueChange={v => updatePref('soundEnabled', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.soundEnabled ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>ALERT SUBSCRIPTIONS</Text>
        <Card style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Shipment Delays</Text>
              <Text style={styles.settingDescription}>
                Transit delay alerts exceeding +2 days
              </Text>
            </View>
            <Switch
              value={prefs.shipmentDelayAlerts}
              onValueChange={v => updatePref('shipmentDelayAlerts', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.shipmentDelayAlerts ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Stock-Out & Buffer Risks</Text>
              <Text style={styles.settingDescription}>
                SKUs falling below calculated safety thresholds
              </Text>
            </View>
            <Switch
              value={prefs.inventoryStockoutAlerts}
              onValueChange={v => updatePref('inventoryStockoutAlerts', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.inventoryStockoutAlerts ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Overdue Purchase Orders</Text>
              <Text style={styles.settingDescription}>
                Supplier acknowledgements and overdue delivery
              </Text>
            </View>
            <Switch
              value={prefs.overduePoAlerts}
              onValueChange={v => updatePref('overduePoAlerts', v)}
              trackColor={{ false: Colors.surfaceElevated, true: Colors.cyan[600] }}
              thumbColor={prefs.overduePoAlerts ? Colors.cyan[300] : Colors.textMuted}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>PUSH DIAGNOSTICS</Text>
        <Card style={styles.card}>
          <Button
            title={isRegistering ? 'Registering Token...' : 'Register / Refresh Push Token'}
            onPress={handleRegisterToken}
            loading={isRegistering}
            variant="secondary"
          />

          <View style={{ height: Spacing.sm }} />

          <Button
            title="Dispatch Test Operational Alert"
            onPress={handleTestAlert}
            variant="ghost"
          />

          {pushToken && (
            <View style={styles.tokenBox}>
              <Text style={styles.tokenLabel}>Registered Push Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={2}>
                {pushToken}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
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
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tokenBox: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  tokenLabel: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontSize: 10,
    fontWeight: '700',
  },
  tokenValue: {
    ...Typography.monoSmall,
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
});
