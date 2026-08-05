import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

export function DependentsSettings() {
  const router = useRouter();
  const { t } = useTranslation();

  const dependents = [
    { id: 'dep-1', name: 'Jane Doe', relation: 'Spouse' },
    { id: 'dep-2', name: 'Jimmy Doe', relation: 'Child' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
      <View style={styles.list}>
        {dependents.map((dep, index) => (
          <TouchableOpacity
            key={dep.id}
            style={[styles.item, index !== dependents.length - 1 && styles.itemBorder]}
            onPress={() => router.push(`/(app)/settings/dependents/${dep.id}`)}
          >
            <View style={styles.itemLeft}>
              <Avatar name={dep.name} size={48} />
              <View style={styles.info}>
                <Text style={styles.name}>{dep.name}</Text>
                <Text style={styles.relation}>{dep.relation}</Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.textTertiary}
              style={{ opacity: 0.5 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.lg }}>
        <Button
          label={t('common.add') || 'Add'}
          onPress={() => router.push('/(app)/settings/dependents/new')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  list: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.tertiary,
    backgroundColor: Colors.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: Spacing.md,
  },
  name: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  relation: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
