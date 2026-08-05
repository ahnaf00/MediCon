import React from 'react';
import { PlaceholderScreen } from '../../../src/components/navigation/PlaceholderScreen';
import { useTranslation } from 'react-i18next';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('history.history') || 'History'}
      description="Placeholder for app/(app)/vitals/history.tsx"
    />
  );
}
