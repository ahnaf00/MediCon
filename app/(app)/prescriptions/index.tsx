import React from 'react';
import { PlaceholderScreen } from '../../../src/components/navigation/PlaceholderScreen';
import { useTranslation } from 'react-i18next';

export default function PrescriptionsScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('prescriptions.prescriptions') || 'Prescriptions'}
      description="Placeholder for app/(app)/prescriptions/index.tsx"
    />
  );
}
