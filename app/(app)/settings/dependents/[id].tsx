import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize } from '../../../../src/theme';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';

export default function DependentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(id === 'dep-1' ? 'Jane Doe' : 'Jimmy Doe');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRelation(id === 'dep-1' ? 'Spouse' : 'Child');
    }
  }, [id, isNew]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.fullName') || 'Full Name'}</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('profile.fullNamePlaceholder') || 'Enter full name'}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('dependents.relation') || 'Relation'}</Text>
          <Input
            value={relation}
            onChangeText={setRelation}
            placeholder={t('dependents.relationPlaceholder') || 'e.g. Spouse, Child'}
          />
        </View>

        <View style={styles.actions}>
          <Button label={t('common.save') || 'Save'} onPress={handleSave} loading={loading} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  form: {
    padding: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.xl,
  },
});
