import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { useAlerts } from '../../src/features/alerts';
import { useData } from '../../src/features/control-tower';

export default function TabsLayout() {
  const { unreadCount } = useAlerts();
  const { metrics } = useData();

  const criticalExceptionsCount = metrics?.criticalExceptionsCount || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surfacePrimary,
          borderTopColor: Colors.borderSubtle,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.cyan[400],
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          ...Typography.labelSmall,
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'pulse' : 'pulse-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="control"
        options={{
          title: 'Control',
          tabBarBadge: criticalExceptionsCount > 0 ? criticalExceptionsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.status.critical.solid,
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'shield' : 'shield-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: 'Orion AI',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.cyan[500],
            color: Colors.textInverse,
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="apps"
        options={{
          title: 'Apps',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
