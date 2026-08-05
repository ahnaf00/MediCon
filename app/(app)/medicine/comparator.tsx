import React from 'react';
import { PlaceholderScreen } from '../../../src/components/navigation/PlaceholderScreen';
import { useTranslation } from 'react-i18next';

export default function ComparatorScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('comparator.comparator') || 'Comparator'}
      description="Placeholder for app/(app)/medicine/comparator.tsx"
    />
  );
}
