import React, { useMemo, useState } from 'react';
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
import { colors, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { useTypography } from '../design/typography';
import { useFonts } from 'expo-font';
import { getSerifFontsForLocale } from '../design/fonts/serifFonts';

export function DilemmaModal() {
  const { chooseDestruction, chooseCompromise, returnToFocus, chains, activeChainId } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t, locale } = useLocale();
  const typography = useTypography();
  const [serifLoaded] = useFonts(getSerifFontsForLocale(locale));
  const styles = useMemo(
    () => makeStyles(themeColors, typography, serifLoaded),
    [themeColors, typography, serifLoaded]
  );
  const [exceptionText, setExceptionText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const activeChainLength =
    (activeChainId ? chains.find((c) => c.id === activeChainId)?.length : undefined) ?? 0;

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
              placeholderTextColor={themeColors.textMuted}
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
          <Text style={[styles.title, { color: themeColors.text }]}>{t('dilemma_title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('dilemma_subtitle')}</Text>

          <View style={styles.options}>
            <HeavyButton
              title={t('dilemma_admitFailureDestroy', { n: String(activeChainLength) })}
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
              <Text style={[styles.backText, { color: themeColors.accent }]}>{t('common_back')}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (
  themeColors: any,
  typography: ReturnType<typeof useTypography>,
  serifLoaded: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
    },
    content: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    title: serifLoaded
      ? {
          ...typography.serif.title,
          color: colors.text,
          marginBottom: spacing.sm,
        }
      : {
          ...typography.title,
          color: colors.text,
          marginBottom: spacing.sm,
        },
    subtitle: serifLoaded
      ? {
          ...typography.serif.subtitle,
          color: colors.textMuted,
          marginBottom: spacing.xxl,
        }
      : {
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
      backgroundColor: themeColors.backgroundSecondary,
      borderRadius: 16,
      padding: spacing.xl,
    },
    inputTitle: serifLoaded
      ? {
          ...typography.serif.title,
          color: colors.text,
          marginBottom: spacing.sm,
        }
      : {
          ...typography.title,
          color: colors.text,
          marginBottom: spacing.sm,
        },
    inputHint: serifLoaded
      ? {
          ...typography.serif.body,
          color: colors.textMuted,
          marginBottom: spacing.lg,
        }
      : {
          ...typography.body,
          color: colors.textMuted,
          marginBottom: spacing.lg,
        },
    input: serifLoaded
      ? {
          backgroundColor: themeColors.background,
          borderRadius: 8,
          padding: spacing.md,
          color: themeColors.text,
          ...typography.serif.body,
          minHeight: 80,
          textAlignVertical: 'top',
        }
      : {
          backgroundColor: themeColors.background,
          borderRadius: 8,
          padding: spacing.md,
          color: themeColors.text,
          ...typography.body,
          fontFamily: 'serif',
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
      // General controls remain sans
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
