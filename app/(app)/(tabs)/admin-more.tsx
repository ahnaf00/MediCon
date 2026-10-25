import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontSize, Spacing } from '@theme';
import { AdminHeader } from '../../../src/components/admin/AdminHeader';
import { useAuthStore } from '../../../src/store/authStore';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ITEMS: { icon: IconName; title: string; text: string; href: string }[] = [
  {
    icon: 'hospital-building',
    title: 'Hospitals',
    text: 'Add, edit or hide the hospitals patients see',
    href: '/(app)/admin/hospitals',
  },
  {
    icon: 'heart-pulse',
    title: 'System health',
    text: 'AI usage, failed transcripts and failed jobs',
    href: '/(app)/admin/system-health',
  },
  {
    icon: 'clipboard-text-clock-outline',
    title: 'Audit log',
    text: 'Every admin action: who, what and why',
    href: '/(app)/admin/audit-log',
  },
  {
    icon: 'cog-outline',
    title: 'Settings',
    text: 'Your account, language and sign out',
    href: '/(app)/settings/',
  },
];

/** Admin More tab (audit L2b): hospitals, system health, audit log and settings. */
export default function AdminMoreTab() {
  const role = useAuthStore((s) => s.role);
  const router = useRouter();
  if (role !== 'admin') return <Redirect href="/(app)/(tabs)" />;

  return (
    <View style={styles.container}>
      <AdminHeader title="More" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.row, i > 0 && styles.divider]}
              onPress={() => router.push(item.href as never)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.icon}>
                <MaterialCommunityIcons name={item.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.text}>{item.text}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: Colors.tertiary },
  icon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  text: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
