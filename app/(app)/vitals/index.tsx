import React from 'react';
import { PlaceholderScreen } from '../../../src/components/navigation/PlaceholderScreen';
import { useTranslation } from 'react-i18next';

export default function VitalsScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('vitals.vitals') || 'Vitals'}
      description="Placeholder for app/(app)/vitals/index.tsx"
    />
  );
}
