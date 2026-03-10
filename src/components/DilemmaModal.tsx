import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import { colors, typography, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';

export function DilemmaModal() {
  const { chooseDestruction, chooseCompromise, returnToFocus } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();
  const [exceptionText, setExceptionText] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleDestruction = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    chooseDestruction();
  };

  const handleCompromisePress = () => {
    setShowInput(true);
  };

  const handleCompromiseSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    chooseCompromise(exceptionText);
    setExceptionText('');
    setShowInput(false);
  };

  const handleCompromiseCancel = () => {
    setShowInput(false);
    setExceptionText('');
  };

  if (showInput) {
    return (
      <Modal visible transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputOverlay}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.inputTitle}>{t('dilemma_recordException')}</Text>
            <Text style={styles.inputHint}>
              {t('dilemma_inputHint')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('dilemma_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={exceptionText}
              onChangeText={setExceptionText}
              multiline
              autoFocus
            />
            <View style={styles.inputActions}>
              <Pressable onPress={handleCompromiseCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('common_cancel')}</Text>
              </Pressable>
              <HeavyButton
                title={t('dilemma_writeRule')}
                onPress={handleCompromiseSubmit}
                variant="secondary"
                style={styles.submitBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="fade">
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('dilemma_title')}</Text>
          <Text style={styles.subtitle}>{t('dilemma_subtitle')}</Text>

          <View style={styles.options}>
            <HeavyButton
              title={t('dilemma_admitFailure')}
              onPress={handleDestruction}
              variant="destruction"
              style={styles.optionButton}
            />
            <HeavyButton
              title={t('dilemma_allowException')}
              onPress={handleCompromisePress}
              variant="secondary"
              style={styles.optionButton}
            />
            <Pressable onPress={returnToFocus} style={styles.backBtn}>
              <Text style={styles.backText}>{t('common_back')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  options: {
    width: '100%',
    gap: spacing.lg,
    alignItems: 'center',
  },
  optionButton: {
    width: '100%',
    maxWidth: 320,
  },
  inputOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  inputContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.xl,
  },
  inputTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputHint: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  submitBtn: {
    minWidth: 140,
  },
  backBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.accent,
  },
});
