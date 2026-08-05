import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@theme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';

interface AnswerComposerProps {
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
}

export const AnswerComposer = ({
  onSubmit,
  loading = false,
}: AnswerComposerProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    await onSubmit(content.trim());
    setContent(''); // clear on success
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Input
          placeholder={t('answercomposer.write_your_answer') || 'Write your answer...'}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={3}
          editable={!loading}
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.buttonContainer}>
          <Button
            label={t('answercomposer.submit_answer') || 'Submit Answer'}
            onPress={handleSubmit}
            disabled={!content.trim() || loading}
            loading={loading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  actions: {
    alignItems: 'flex-end',
  },
  buttonContainer: {
    minWidth: 140,
  },
});
