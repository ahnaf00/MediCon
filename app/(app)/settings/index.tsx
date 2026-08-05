import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/store/authStore';
import { Colors, Spacing, FontFamily, FontSize } from '../../../src/theme';
import { DraggableBottomSheet } from '../../../src/components/ui/DraggableBottomSheet';
import { ProfileSettings } from '../../../src/components/settings/ProfileSettings';
import { LanguageSettings } from '../../../src/components/settings/LanguageSettings';
import { DependentsSettings } from '../../../src/components/settings/DependentsSettings';
import { DevSettings } from '../../../src/components/settings/DevSettings';

type ActiveSheet = 'profile' | 'dependents' | 'language' | 'dev' | null;

const MenuItem = ({
  icon,
  title,
  onPress,
  isLast = false,
  danger = false,
  showArrow = true,
}: any) => {
  return (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={danger ? Colors.danger : Colors.primary}
        />
        <Text style={[styles.menuItemText, danger && { color: Colors.danger }]}>{title}</Text>
      </View>
      {showArrow && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={Colors.textSecondary}
          style={{ opacity: 0.5 }}
        />
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const insets = useSafeAreaInsets();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View
        style={{
          backgroundColor: Colors.surface,
          paddingTop: insets.top,
          marginBottom: Spacing.md,
        }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.title') || 'Settings'}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={[styles.section, { marginTop: 0 }]}>
          <MenuItem
            icon="account-outline"
            title={t('settings.profile') || 'Profile'}
            onPress={() => setActiveSheet('profile')}
          />
          <MenuItem
            icon="account-group-outline"
            title={t('settings.dependents') || 'Dependents'}
            onPress={() => setActiveSheet('dependents')}
          />
          <MenuItem
            icon="translate"
            title={t('settings.language') || 'Language'}
            onPress={() => setActiveSheet('language')}
            isLast={true}
          />
        </View>

        {__DEV__ && (
          <View style={styles.section}>
            <MenuItem
              icon="hammer-wrench"
              title="Developer Settings (QA)"
              onPress={() => setActiveSheet('dev')}
              isLast={true}
            />
          </View>
        )}

        <View style={styles.section}>
          <MenuItem
            icon="logout"
            title={t('settings.logout') || 'Log out'}
            onPress={handleLogout}
            isLast={true}
            danger={true}
            showArrow={false}
          />
        </View>
      </ScrollView>

      <DraggableBottomSheet
        visible={activeSheet !== null}
        onClose={() => setActiveSheet(null)}
        title={
          activeSheet === 'profile'
            ? t('settings.profile') || 'Profile'
            : activeSheet === 'dependents'
              ? t('settings.dependents') || 'Dependents'
              : activeSheet === 'language'
                ? t('settings.language') || 'Language'
                : activeSheet === 'dev'
                  ? 'Developer Settings'
                  : ''
        }
      >
        {activeSheet === 'profile' && <ProfileSettings />}
        {activeSheet === 'dependents' && <DependentsSettings />}
        {activeSheet === 'language' && <LanguageSettings />}
        {activeSheet === 'dev' && <DevSettings />}
      </DraggableBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.base,
    paddingLeft: 5,
    paddingVertical: Spacing.sm,
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
  section: {
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.tertiary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
    lineHeight: FontSize.md * 1.5,
  },
});
