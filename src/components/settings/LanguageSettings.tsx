import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, LanguageCode } from '../../store/settingsStore';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';

export function LanguageSettings() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const languages: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.description}>{t('settings.languageSelection') || 'Select Language'}</Text>
      <View style={styles.list}>
        {languages.map((lang, index) => {
          const isSelected = language === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.item,
                isSelected && styles.itemSelected,
                index !== languages.length - 1 && styles.itemBorder,
              ]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{lang.label}</Text>
              {isSelected && (
                <MaterialCommunityIcons name="check" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: FontSize.sm * 1.5,
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  itemSelected: {
    backgroundColor: Colors.primary + '10', // 10% opacity
  },
  label: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  labelSelected: {
    fontFamily: FontFamily.semiBold,
    color: Colors.primary,
  },
});
