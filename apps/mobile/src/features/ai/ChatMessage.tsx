import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIMessage } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Badge } from '../../components';

interface ChatMessageProps {
  message: AIMessage;
  onExecuteAction?: (action: NonNullable<AIMessage['recommendedAction']>) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onExecuteAction,
}) => {
  const isUser = message.role === 'user';

  // Parse inline bold (**bold**), code (`code`), and normal text
  const renderInline = (text: string, baseStyle: any, keyPrefix: string) => {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push({
          type: 'bold',
          content: token.slice(2, -2),
        });
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push({
          type: 'code',
          content: token.slice(1, -1),
        });
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'bold') {
        return (
          <Text key={`${keyPrefix}-b-${pIdx}`} style={[baseStyle, styles.mdBold]}>
            {part.content}
          </Text>
        );
      }
      if (part.type === 'code') {
        return (
          <Text key={`${keyPrefix}-c-${pIdx}`} style={[baseStyle, styles.mdCode]}>
            {part.content}
          </Text>
        );
      }
      return (
        <Text key={`${keyPrefix}-t-${pIdx}`} style={baseStyle}>
          {part.content}
        </Text>
      );
    });
  };

  // Format pseudo-markdown lines for clean mobile reading
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <Text key={idx} style={styles.mdHeader}>
            {trimmed.replace(/^###\s+/, '')}
          </Text>
        );
      }
      // Heading 2 or 1
      if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        return (
          <Text key={idx} style={styles.mdHeader}>
            {trimmed.replace(/^#+\s+/, '')}
          </Text>
        );
      }
      // Standalone bold line like **Current Status Highlights:**
      if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
        return (
          <Text key={idx} style={styles.mdSubHeader}>
            {trimmed.slice(2, -2)}
          </Text>
        );
      }
      // Bullet items: - or *
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.slice(2);
        return (
          <View key={idx} style={styles.mdBulletRow}>
            <Text style={styles.mdBulletDot}>•</Text>
            <Text style={styles.mdBulletText}>
              {renderInline(content, styles.mdBody, `bullet-${idx}`)}
            </Text>
          </View>
        );
      }
      // Numbered items: 1. 2. etc.
      const numMatch = trimmed.match(/^(\d+\.)\s+(.+)$/);
      if (numMatch) {
        return (
          <View key={idx} style={styles.mdBulletRow}>
            <Text style={styles.mdNumberLabel}>{numMatch[1]}</Text>
            <Text style={styles.mdBulletText}>
              {renderInline(numMatch[2], styles.mdBody, `num-${idx}`)}
            </Text>
          </View>
        );
      }
      // Spacing on empty lines
      if (trimmed === '') {
        return <View key={idx} style={styles.mdSpacing} />;
      }
      // Standard paragraph with inline formatting
      return (
        <Text key={idx} style={styles.mdBody}>
          {renderInline(line, styles.mdBody, `para-${idx}`)}
        </Text>
      );
    });
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAssistant,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatarRow}>
          <Ionicons
            name={isUser ? 'person-circle-outline' : 'hardware-chip-outline'}
            size={16}
            color={isUser ? Colors.cyan[400] : Colors.cyan[300]}
          />
          <Text style={styles.senderName}>
            {isUser ? 'You' : 'Orion AI Copilot'}
          </Text>
        </View>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </View>

      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        {renderFormattedText(message.text)}

        {/* Evidence Grounding Tags */}
        {message.evidence && message.evidence.length > 0 && (
          <View style={styles.evidenceContainer}>
            <Text style={styles.evidenceHeader}>GROUNDING EVIDENCE & PROVENANCE</Text>
            {message.evidence.map((ev, i) => {
              const tagVariant =
                ev.groundingType === 'KNOWN'
                  ? 'success'
                  : ev.groundingType === 'CALCULATED'
                  ? 'info'
                  : 'warning';

              return (
                <View key={i} style={styles.evidenceRow}>
                  <Badge
                    label={ev.groundingType || 'KNOWN'}
                    variant={tagVariant}
                    size="small"
                  />
                  <Text style={styles.evidenceText}>
                    <Text style={styles.evidenceMetric}>{ev.metric}: </Text>
                    {ev.value}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recommended Action Proposal */}
        {message.recommendedAction && (
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Ionicons name="flash-outline" size={16} color={Colors.cyan[400]} />
              <Text style={styles.actionTitle}>PROPOSED OPERATIONAL ACTION</Text>
            </View>
            <Text style={styles.actionLabel}>
              {message.recommendedAction.label}
            </Text>
            <Text style={styles.actionEntity}>
              Target: {message.recommendedAction.entityId} ({message.recommendedAction.actionType})
            </Text>

            {onExecuteAction && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onExecuteAction(message.recommendedAction!)}
                accessibilityRole="button"
                accessibilityLabel={`Execute recommended action: ${message.recommendedAction.label}`}
              >
                <Ionicons name="checkmark-sharp" size={16} color={Colors.textInverse} />
                <Text style={styles.actionButtonText}>Execute & Authorize Action</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    maxWidth: '94%',
  },
  containerUser: {
    alignSelf: 'flex-end',
  },
  containerAssistant: {
    alignSelf: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  senderName: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  bubble: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  bubbleUser: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
  },
  bubbleAssistant: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  mdHeader: {
    ...Typography.titleSmall,
    color: Colors.cyan[300],
    fontWeight: '700',
    marginBottom: 6,
  },
  mdSubHeader: {
    ...Typography.titleSmall,
    color: Colors.cyan[200],
    fontWeight: '700',
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  mdBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mdCode: {
    ...Typography.monoSmall,
    color: Colors.cyan[300],
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  mdBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingLeft: Spacing.xs,
  },
  mdBulletDot: {
    color: Colors.cyan[400],
    fontSize: 14,
    lineHeight: 20,
    marginRight: 6,
  },
  mdBulletText: {
    flex: 1,
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  mdNumberLabel: {
    color: Colors.cyan[400],
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
    marginRight: 6,
  },
  mdBody: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  mdBullet: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: 2,
  },
  mdBulletItem: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    lineHeight: 20,
    paddingLeft: Spacing.xs,
    marginTop: 2,
  },
  mdSpacing: {
    height: 8,
  },
  evidenceContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  evidenceHeader: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 3,
  },
  evidenceText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    fontSize: 11,
  },
  evidenceMetric: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  actionCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderCyan,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  actionTitle: {
    ...Typography.caption,
    color: Colors.cyan[400],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  actionLabel: {
    ...Typography.titleSmall,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  actionEntity: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.cyan[500],
    borderRadius: Radius.sm,
    paddingVertical: 8,
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    ...Typography.labelSmall,
    color: Colors.textInverse,
    fontWeight: '700',
  },
});
