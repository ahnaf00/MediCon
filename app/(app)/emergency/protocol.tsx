import React from 'react';
import { PlaceholderScreen } from '../../../src/components/navigation/PlaceholderScreen';
import { useTranslation } from 'react-i18next';

export default function ProtocolScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('protocol.protocol') || 'Protocol'}
      description="Placeholder for app/(app)/emergency/protocol.tsx"
    />
  );
}
