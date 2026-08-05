import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing } from '../../theme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ProfileSettings() {
  const { t } = useTranslation();
  const [name, setName] = useState('John Doe');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Spacing.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <Input
          label={t('profile.fullName') || 'Full Name'}
          value={name}
          onChangeText={setName}
          placeholder={t('profile.fullNamePlaceholder') || 'Enter your full name'}
        />

        <Input
          label={t('profile.phone') || 'Phone Number'}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('profile.phonePlaceholder') || 'Enter your phone number'}
          keyboardType="phone-pad"
        />

        <Button label={t('common.save') || 'Save Changes'} onPress={handleSave} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  form: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
});
