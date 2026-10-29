import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, ConfirmationModal } from '../../src/components';
import {
  aiService,
  ChatMessage,
  QuickPromptsBar,
  Composer,
} from '../../src/features/ai';
import { useData } from '../../src/features/control-tower';
import { Colors, Spacing } from '../../src/theme';
import { AIMessage } from '../../src/types';

export default function OrionAIScreen() {
  const { executeAction, refreshData } = useData();
  const flatListRef = useRef<FlatList>(null);

  const initialGreeting: AIMessage = {
    id: 'ai-initial',
    role: 'assistant',
    text:
      `### Orion-9 AI Decision Intelligence Online\n` +
      `I am continuously monitoring real-time telemetry across logistics lanes, warehouse buffers, and supplier scorecards.\n\n` +
      `**Current Status Highlights:**\n` +
      `- **Network Health**: 87% nominal index\n` +
      `- **Top Risk**: SKU-1000 buffer deficit (Chicago DC)\n` +
      `- **Delay Alert**: Maritime transit SHP-2026-0001 (+4 days)\n\n` +
      `Select a quick prompt below or ask an operational query.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    evidence: [
      {
        source: 'Event Fabric Grounding',
        metric: 'Data Freshness',
        value: 'Live telemetry stream',
        groundingType: 'KNOWN',
      },
    ],
  };

  const [messages, setMessages] = useState<AIMessage[]>([initialGreeting]);
  const [isLoading, setIsLoading] = useState(false);

  // Action confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    action: NonNullable<AIMessage['recommendedAction']> | null;
  }>({
    visible: false,
    action: null,
  });

  const [isExecuting, setIsExecuting] = useState(false);

  const handleSendMessage = async (text: string) => {
    const userMsg: AIMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await aiService.sendMessage(text, messages);
      setMessages(prev => [...prev, response]);
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `### AI Service Interruption\nUnable to reach decision model: ${err.message || 'Unknown network error'}. Please retry shortly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: NonNullable<AIMessage['recommendedAction']>) => {
    setConfirmModal({
      visible: true,
      action,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.action) return;
    setIsExecuting(true);
    try {
      const res = await executeAction(
        confirmModal.action.actionType,
        confirmModal.action.entityId || '',
        confirmModal.action.payload
      );
      setConfirmModal({ visible: false, action: null });
      Alert.alert('Action Authorized', res.message);
      await refreshData();
    } catch (err: any) {
      Alert.alert('Authorization Failed', err.message || 'Action could not be executed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([initialGreeting]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="ORION AI"
        subtitle="Autonomous Decision Intelligence"
        rightAction={{
          icon: 'trash-outline',
          onPress: handleClearHistory,
          accessibilityLabel: 'Reset conversation history',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardView}
      >
        {/* Preset Prompt Pills */}
        <QuickPromptsBar
          onSelectPrompt={handleSendMessage}
          disabled={isLoading}
        />

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              onExecuteAction={handleActionClick}
            />
          )}
        />

        {/* Message Composer */}
        <Composer
          onSend={handleSendMessage}
          isLoading={isLoading}
        />
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      {confirmModal.action && (
        <ConfirmationModal
          visible={confirmModal.visible}
          title={`Confirm Action: ${confirmModal.action.label}`}
          description={`You are about to authorize '${confirmModal.action.actionType}' for target '${confirmModal.action.entityId}'. This will immediately update the live operational ledger.`}
          confirmLabel="Execute & Commit"
          cancelLabel="Cancel"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal({ visible: false, action: null })}
          isConsequential
          isLoading={isExecuting}
        />
      )}
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
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
