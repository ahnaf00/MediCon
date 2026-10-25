import { Tabs } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, FontSize, FontFamily } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';

export default function TabsLayout() {
  const role = useAuthStore((s) => s.role);
  const isDoctor = role === 'doctor';
  // Admins get their own tabs (audit L2b): Overview, Doctors, Users, Visits, More.
  const isAdmin = role === 'admin';
  const isPatient = !isDoctor && !isAdmin;

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
          title: isDoctor ? 'Dashboard' : isAdmin ? 'Overview' : 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={isAdmin ? 'view-dashboard-outline' : 'home-outline'}
              size={isAdmin ? size : size + 3}
              color={color}
            />
          ),
        }}
      />

      {/* Admin Tabs */}
      <Tabs.Screen
        name="admin-doctors"
        options={{
          title: 'Doctors',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="doctor" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-users"
        options={{
          title: 'Users',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-visits"
        options={{
          title: 'Visits',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin-more"
        options={{
          title: 'More',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="dots-horizontal-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Patient Tabs */}
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Doctors',
          href: isPatient ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="stethoscope" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Prescription',
          href: isPatient ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-pulse-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask-doctor"
        options={{
          title: 'Ask Doctor',
          href: isPatient ? undefined : null,
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
