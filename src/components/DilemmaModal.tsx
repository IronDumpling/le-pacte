import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
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

type DilemmaView = 'main' | 'pauseSelect' | 'addRule';

export function DilemmaModal() {
  const {
    chooseDestruction,
    chooseCompromise,
    chooseExistingRule,
    returnToFocus,
    chains,
    activeChainId,
    dilemmaSource,
  } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t, locale } = useLocale();
  const typography = useTypography();
  const [serifLoaded] = useFonts(getSerifFontsForLocale(locale));
  const styles = useMemo(
    () => makeStyles(themeColors, typography, serifLoaded),
    [themeColors, typography, serifLoaded]
  );

  const [view, setView] = useState<DilemmaView>('main');
  const [addRuleText, setAddRuleText] = useState('');
  const [addRuleError, setAddRuleError] = useState<string | null>(null);

  const activeChain = activeChainId ? chains.find((c) => c.id === activeChainId) : undefined;
  const activeChainLength = activeChain?.length ?? 0;
  const precedentRules = activeChain?.precedentRules ?? [];

  const handleDestruction = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    chooseDestruction();
  };

  const handleAllowException = () => {
    if (precedentRules.length === 0) {
      // No existing rules — go straight to add-rule form
      setView('addRule');
    } else {
      setView('pauseSelect');
    }
  };

  const handleSelectRule = (index: number, text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    chooseExistingRule(index + 1, text);
  };

  const handleAddRuleSubmit = () => {
    const trimmed = addRuleText.trim();
    if (!trimmed) {
      setAddRuleError(t('dilemma_ruleEmpty'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    chooseCompromise(trimmed);
  };

  const handleAddRuleCancel = () => {
    setAddRuleText('');
    setAddRuleError(null);
    setView(precedentRules.length > 0 ? 'pauseSelect' : 'main');
  };

  // ── add-rule form ──────────────────────────────────────────────────────────
  if (view === 'addRule') {
    return (
      <Modal visible animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.addRuleOverlay, { backgroundColor: themeColors.background }]}
        >
          <SafeAreaView style={styles.addRuleInner} edges={['top', 'bottom']}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {t('dilemma_recordException')}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              {t('dilemma_inputHint')}
            </Text>
            <TextInput
              style={[styles.addRuleInput, {
                backgroundColor: themeColors.backgroundSecondary,
                color: themeColors.text,
              }]}
              placeholder={t('dilemma_placeholder')}
              placeholderTextColor={themeColors.textMuted}
              value={addRuleText}
              onChangeText={(text) => {
                setAddRuleText(text);
                if (addRuleError) setAddRuleError(null);
              }}
              multiline
              autoFocus
            />
            {addRuleError ? (
              <Text style={styles.addRuleError}>{addRuleError}</Text>
            ) : null}
            <View style={styles.addRuleActions}>
              <HeavyButton
                title={t('common_cancel')}
                onPress={handleAddRuleCancel}
                variant="secondary"
                style={styles.addRuleBtn}
              />
              <HeavyButton
                title={t('dilemma_writeRule')}
                onPress={handleAddRuleSubmit}
                variant="primary"
                style={styles.addRuleBtn}
              />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // ── rule selection list ────────────────────────────────────────────────────
  if (view === 'pauseSelect') {
    return (
      <Modal visible animationType="fade">
        <SafeAreaView style={[styles.listContainer, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
          <View style={[styles.listHeader, { borderBottomColor: themeColors.textMuted }]}>
            <Text style={[styles.listTitle, { color: themeColors.text }]}>{t('pause_title')}</Text>
            <Text style={[styles.listSubtitle, { color: themeColors.textMuted }]}>{t('pause_subtitle')}</Text>
          </View>
          <FlatList
            data={precedentRules}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => {
              const nodePart = item.nodeIndex >= 0
                ? t('chain_nodeLabel', { n: String(item.nodeIndex + 1) })
                : t('chain_preset');
              const line = t('idle_ruleAddedAt', { n: String(index + 1), session: nodePart, text: item.text });
              return (
                <Pressable
                  onPress={() => handleSelectRule(index, item.text)}
                  style={({ pressed }) => [
                    styles.ruleItem,
                    { backgroundColor: themeColors.backgroundSecondary },
                    pressed && styles.ruleItemPressed,
                  ]}
                >
                  <Text style={[styles.ruleText, { color: themeColors.text }]}>{line}</Text>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.listFooter}>
            <Pressable
              style={styles.addRuleBox}
              onPress={() => setView('addRule')}
            >
              <Text style={[styles.addRulePlus, { color: themeColors.textMuted }]}>+</Text>
              <Text style={[styles.addRuleHint, { color: themeColors.textMuted }]}>{t('pause_addRule')}</Text>
            </Pressable>
            <HeavyButton
              title={t('common_back')}
              onPress={() => setView('main')}
              variant="secondary"
              style={styles.listFooterBtn}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── main dilemma view ──────────────────────────────────────────────────────
  return (
    <Modal visible animationType="fade">
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: themeColors.text }]}>{t('dilemma_title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('dilemma_subtitle')}</Text>

          <View style={styles.options}>
            <HeavyButton
              title={t('dilemma_admitFailureDestroy', { n: String(activeChainLength), sessions: activeChainLength <= 1 ? 'Session' : 'Sessions' })}
              onPress={handleDestruction}
              variant="destruction"
              style={styles.optionButton}
            />
            <HeavyButton
              title={t('dilemma_allowException')}
              onPress={handleAllowException}
              variant="secondary"
              style={styles.optionButton}
            />
            {dilemmaSource !== 'minimize' && (
              <Pressable onPress={returnToFocus} style={styles.backBtn}>
                <Text style={[styles.backText, { color: themeColors.accent }]}>{t('common_back')}</Text>
              </Pressable>
            )}
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
    // ── main view ──
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
      ? { ...typography.serif.title, color: colors.text, marginBottom: spacing.sm }
      : { ...typography.title, color: colors.text, marginBottom: spacing.sm },
    subtitle: serifLoaded
      ? { ...typography.serif.subtitle, color: colors.textMuted, marginBottom: spacing.xxl }
      : { ...typography.body, color: colors.textMuted, marginBottom: spacing.xxl },
    options: {
      width: '100%',
      gap: spacing.lg,
      alignItems: 'center',
    },
    optionButton: {
      width: '100%',
      maxWidth: 320,
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
    // ── rule list view ──
    listContainer: {
      flex: 1,
    },
    listHeader: {
      padding: spacing.xl,
      borderBottomWidth: 1,
    },
    listTitle: serifLoaded
      ? { ...typography.serif.title, color: colors.text }
      : { ...typography.title, color: colors.text },
    listSubtitle: serifLoaded
      ? { ...typography.serif.subtitle, color: colors.textMuted, marginTop: spacing.sm }
      : { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
    listContent: {
      padding: spacing.xl,
    },
    ruleItem: {
      borderRadius: 8,
      padding: spacing.lg,
      marginBottom: spacing.sm,
    },
    ruleItemPressed: {
      opacity: 0.8,
    },
    ruleText: serifLoaded
      ? { ...typography.serif.body, color: colors.text }
      : { ...typography.body, color: colors.text },
    listFooter: {
      padding: spacing.xl,
      gap: spacing.md,
      alignItems: 'center',
    },
    listFooterBtn: {
      minWidth: 200,
    },
    addRuleBox: {
      width: '100%',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: themeColors.textMuted,
      borderRadius: 8,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addRulePlus: {
      ...typography.title,
      fontSize: 28,
      marginBottom: spacing.xs,
    },
    addRuleHint: {
      ...typography.body,
    },
    // ── add-rule form ──
    addRuleOverlay: {
      flex: 1,
    },
    addRuleInner: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    addRuleInput: {
      borderRadius: 8,
      padding: spacing.md,
      ...typography.body,
      minHeight: 80,
      textAlignVertical: 'top',
      marginTop: spacing.lg,
    },
    addRuleError: {
      ...typography.body,
      color: colors.destructionBase,
      marginTop: spacing.sm,
    },
    addRuleActions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    addRuleBtn: {
      flex: 1,
      minWidth: 0,
    },
  });
