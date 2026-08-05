// 1. IMPORTS
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { doctorsService } from '../../../src/services/api/doctorsService';
import { useTranslation } from 'react-i18next';

// 2. TYPES
type Category = {
  id: string;
  name: string;
  icon: string;
  keyword?: string;
};

// 3. COMPONENT
export default function DepartmentsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await doctorsService.getCategories();
        setCategories(data);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const renderItem: ListRenderItem<Category> = useCallback(
    ({ item: category }) => (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => router.push(`/(app)/doctors/?category=${category.id}`)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={category.name}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={26}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>
          {category.name}
        </Text>
        {category.keyword && (
          <Text style={styles.categoryKeyword} numberOfLines={1}>
            {category.keyword}
          </Text>
        )}
      </TouchableOpacity>
    ),
    [router],
  );

  return (
    <View style={styles.container}>
      {/* Header Wrapper */}
      <View style={[styles.headerWrapper, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('doctors.departments') || 'Departments'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="hospital-building" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No departments found</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={categories}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, Spacing.md) },
            ]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

// 4. STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerWrapper: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
    height: 60,
    gap: Spacing.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: 0,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.5,
  },

  // Grid item styling mirrored from doctors.tsx
  gridItem: {
    flex: 1,
    height: 140,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.tertiary,
    marginHorizontal: Spacing.sm / 2, // Half gap on each side for numColumns
    marginBottom: Spacing.sm, // Same as horizontal gap
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  categoryKeyword: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
});
