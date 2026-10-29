/**
 * ORION-9 OPERATIONAL CONFIRMATION MODAL
 * Requires explicit operator verification before executing high-impact SCM actions.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { Button } from './Button';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  impactWarning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isConsequential?: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  impactWarning,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isConsequential = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const isWorking = isLoading || internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                isDestructive || isConsequential ? styles.iconWarning : styles.iconInfo,
              ]}
            >
              <Ionicons
                name={isDestructive ? 'trash-outline' : 'shield-checkmark-outline'}
                size={24}
                color={
                  isDestructive
                    ? Colors.status.critical.text
                    : Colors.cyan[400]
                }
              />
            </View>
            <TouchableOpacity
              onPress={onCancel}
              style={styles.closeButton}
              hitSlop={Layout.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {impactWarning && (
            <View style={styles.warningBox}>
              <Ionicons
                name="warning-outline"
                size={16}
                color={Colors.status.high.text}
              />
              <Text style={styles.warningText}>{impactWarning}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="outline"
              onPress={onCancel}
              disabled={isWorking}
              style={styles.actionBtn}
            />
            <Button
              label={confirmLabel}
              variant={isDestructive ? 'danger' : 'primary'}
              onPress={handleConfirm}
              loading={isWorking}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 16, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.base,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInfo: {
    backgroundColor: Colors.cyan.glow,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  iconWarning: {
    backgroundColor: Colors.status.critical.bg,
    borderWidth: 1,
    borderColor: Colors.status.critical.border,
  },
  closeButton: {
    padding: Spacing.xxs,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.base,
    marginBottom: Spacing.base,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.status.high.bg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.status.high.border,
  },
  warningText: {
    fontSize: Typography.fontSizes.xs,
    color: Colors.status.high.text,
    fontWeight: Typography.fontWeights.medium,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
