import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, FontSize, FontFamily } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';

export default function TabsLayout() {
  const role = useAuthStore((s) => s.role);
  const isDoctor = role === 'doctor';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 109, // 53dp content + 56dp bottom padding
          paddingBottom: 56,
          paddingTop: 5,
          backgroundColor: Colors.surface,
          borderTopColor: Colors.tertiary,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarButton: (props) => <TouchableOpacity activeOpacity={1} {...(props as any)} />,
        tabBarItemStyle: {
          backgroundColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: FontSize.sm,
          fontFamily: FontFamily.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isDoctor ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size + 3} color={color} />
          ),
        }}
      />

      {/* Patient Tabs */}
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          href: isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="stethoscope" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Prescription',
          href: isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask-doctor"
        options={{
          title: 'Ask Doctor',
          href: isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat-question-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Doctor Tabs */}
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          href: !isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          href: !isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qna-inbox"
        options={{
          title: 'Q&A Inbox',
          href: !isDoctor ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="inbox-outline" size={size - 2} color={color} />
          ),
        }}
      />

      {/* Hidden from tab bar */}
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="hospitals" options={{ href: null }} />
    </Tabs>
  );
}
