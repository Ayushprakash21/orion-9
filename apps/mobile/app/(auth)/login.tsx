import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/features/auth';
import { Colors, Typography, Spacing, Radius } from '../../src/theme';
import { Button, Badge } from '../../src/components';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, environment, setEnvironment, error: authError, clearError } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnvToggle = async (env: 'DEMO' | 'LIVE') => {
    clearError();
    setLocalError(null);
    await setEnvironment(env);
    if (env === 'LIVE') {
      setUsername('');
      setPassword('');
    } else {
      setUsername('admin');
      setPassword('demo123');
    }
  };

  const handleQuickRole = (role: 'admin' | 'user') => {
    clearError();
    setLocalError(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('demo123');
    } else {
      setUsername('user');
      setPassword('demo123');
    }
  };

  const handleLogin = async () => {
    setLocalError(null);
    clearError();

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username/email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="hardware-chip" size={32} color={Colors.cyan[400]} />
            </View>
            <Text style={styles.brandTitle}>ORION-9</Text>
            <Text style={styles.brandSubtitle}>SUPPLY CHAIN OPERATING SYSTEM</Text>
            <Text style={styles.mobileLabel}>Mobile Control Center</Text>
          </View>

          {/* Environment Switcher */}
          <View style={styles.envContainer}>
            <Text style={styles.envLabel}>SELECT ENVIRONMENT</Text>
            <View style={styles.envToggleRow}>
              <TouchableOpacity
                style={[
                  styles.envOption,
                  environment === 'DEMO' && styles.envOptionActive,
                ]}
                onPress={() => handleEnvToggle('DEMO')}
                accessibilityRole="button"
                accessibilityLabel="Switch to DEMO mode"
              >
                <Ionicons
                  name="flask-outline"
                  size={16}
                  color={environment === 'DEMO' ? Colors.cyan[400] : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.envOptionText,
                    environment === 'DEMO' && styles.envOptionTextActive,
                  ]}
                >
                  Demo Mode (Zero-Config)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.envOption,
                  environment === 'LIVE' && styles.envOptionActive,
                ]}
                onPress={() => handleEnvToggle('LIVE')}
                accessibilityRole="button"
                accessibilityLabel="Switch to LIVE mode"
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={environment === 'LIVE' ? Colors.cyan[400] : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.envOptionText,
                    environment === 'LIVE' && styles.envOptionTextActive,
                  ]}
                >
                  Production Live
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Demo Quick Role Selector */}
          {environment === 'DEMO' && (
            <View style={styles.quickRoleBox}>
              <Text style={styles.quickRoleTitle}>QUICK DEMO PROFILES</Text>
              <View style={styles.roleButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    username === 'admin' && styles.roleButtonActive,
                  ]}
                  onPress={() => handleQuickRole('admin')}
                  accessibilityRole="button"
                  accessibilityLabel="Use Elena Rostova VP Admin profile"
                >
                  <Text style={styles.roleButtonName}>Elena Rostova</Text>
                  <Text style={styles.roleButtonRole}>VP Supply Chain (Admin)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    username === 'user' && styles.roleButtonActive,
                  ]}
                  onPress={() => handleQuickRole('user')}
                  accessibilityRole="button"
                  accessibilityLabel="Use Marcus Vance Logistics Lead profile"
                >
                  <Text style={styles.roleButtonName}>Marcus Vance</Text>
                  <Text style={styles.roleButtonRole}>Logistics Lead (Operator)</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Error Banner */}
          {displayError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.status.critical.text} />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {environment === 'DEMO' ? 'DEMO USERNAME' : 'ENTERPRISE EMAIL'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={environment === 'DEMO' ? 'admin or user' : 'operator@orion9.tech'}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  accessibilityLabel="Username or email input"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={isSubmitting ? 'Authenticating...' : 'Sign In to Control Center'}
              onPress={handleLogin}
              loading={isSubmitting}
              style={styles.loginButton}
            />
          </View>

          {/* Enterprise Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.securityText}>
              End-to-end encrypted telemetry • Orion-9 Zero-Trust Architecture
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.borderCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brandTitle: {
    ...Typography.titleLarge,
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  brandSubtitle: {
    ...Typography.labelSmall,
    color: Colors.cyan[400],
    letterSpacing: 1.5,
    marginTop: 4,
  },
  mobileLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  envContainer: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  envLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  envToggleRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  envOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  envOptionActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderCyan,
  },
  envOptionText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  envOptionTextActive: {
    color: Colors.cyan[300],
  },
  quickRoleBox: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  quickRoleTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  roleButtonGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  roleButton: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  roleButtonActive: {
    borderColor: Colors.borderCyan,
    backgroundColor: Colors.surfaceElevated,
  },
  roleButtonName: {
    ...Typography.labelSmall,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  roleButtonRole: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontSize: 10,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.status.critical.bg,
    borderWidth: 1,
    borderColor: Colors.status.critical.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.status.critical.text,
    flex: 1,
  },
  formContainer: {
    backgroundColor: Colors.surfacePrimary,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    height: '100%',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  securityText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
});
