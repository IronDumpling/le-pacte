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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { PrecedentRule } from '../types/chain';
import { colors, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { useTypography } from '../design/typography';
import { HeavyButton } from '../design/components';
import { usePacteStore } from '../store/pacteStore';

interface PauseModalProps {
  precedentRules: PrecedentRule[];
  onBack: () => void;
  serifLoaded: boolean;
}

export function PauseModal({
  precedentRules,
  onBack,
  serifLoaded,
}: PauseModalProps) {
  const { chooseExistingRule, chooseCompromise } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(themeColors, typography, serifLoaded),
    [themeColors, typography, serifLoaded]
  );

  const [showAddRule, setShowAddRule] = useState(false);
  const [addRuleText, setAddRuleText] = useState('');
  const [addRuleError, setAddRuleError] = useState<string | null>(null);

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
    setShowAddRule(false);
    setAddRuleText('');
    setAddRuleError(null);
  };

  if (showAddRule) {
    return (
      <Modal visible animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.addRuleOverlay, { backgroundColor: themeColors.background }]}
        >
          <View style={[styles.addRuleInner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Text style={[styles.addRuleTitle, { color: themeColors.text }]}>
              {t('dilemma_recordException')}
            </Text>
            <Text style={[styles.addRuleHint, { color: themeColors.textMuted }]}>
              {t('dilemma_inputHint')}
            </Text>
            <TextInput
              style={[styles.addRuleInput, { backgroundColor: themeColors.backgroundSecondary, color: themeColors.text }]}
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
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="fade">
      <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>{t('pause_title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('pause_subtitle')}</Text>
        </View>
        <FlatList
          data={precedentRules}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => {
            const nodePart = item.nodeIndex >= 0 ? t('chain_nodeLabel', { n: String(item.nodeIndex + 1) }) : t('chain_preset');
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
          contentContainerStyle={styles.list}
        />
        <View style={styles.footer}>
          <HeavyButton
            title={t('pause_addRule')}
            onPress={() => setShowAddRule(true)}
            variant="secondary"
            style={styles.footerBtn}
          />
          <HeavyButton
            title={t('common_back')}
            onPress={onBack}
            variant="secondary"
            style={styles.footerBtn}
          />
        </View>
      </View>
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
    },
    header: {
      padding: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.backgroundSecondary,
    },
    title: {
      ...typography.title,
      fontFamily: serifLoaded ? typography.serif.title.fontFamily : typography.title.fontFamily,
      color: colors.text,
    },
    subtitle: {
      ...typography.body,
      fontFamily: serifLoaded ? typography.serif.subtitle.fontFamily : typography.body.fontFamily,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    list: {
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
    ruleText: {
      ...typography.body,
      fontFamily: serifLoaded ? typography.serif.body.fontFamily : typography.body.fontFamily,
      color: colors.text,
    },
    footer: {
      padding: spacing.xl,
      gap: spacing.md,
      alignItems: 'center',
    },
    footerBtn: {
      minWidth: 200,
    },
    addRuleOverlay: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    addRuleInner: {
      flex: 1,
      justifyContent: 'center',
    },
    addRuleTitle: {
      ...typography.title,
      fontFamily: serifLoaded ? typography.serif.title.fontFamily : typography.title.fontFamily,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    addRuleHint: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    addRuleInput: {
      borderRadius: 8,
      padding: spacing.md,
      ...typography.body,
      minHeight: 80,
      textAlignVertical: 'top',
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
