import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PrecedentRule } from '../types/chain';
import { colors, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { useTypography } from '../design/typography';
import { HeavyButton } from '../design/components';

interface PauseModalProps {
  precedentRules: PrecedentRule[];
  onSelect: (ruleIndex: number, ruleText: string) => void;
  onBack: () => void;
  serifLoaded: boolean;
}

export function PauseModal({
  precedentRules,
  onSelect,
  onBack,
  serifLoaded,
}: PauseModalProps) {
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => makeStyles(themeColors, typography, serifLoaded),
    [themeColors, typography, serifLoaded]
  );
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
                onPress={() => onSelect(index + 1, item.text)}
                style={({ pressed }) => [
                  [styles.ruleItem, { backgroundColor: themeColors.backgroundSecondary }],
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
            title={t('common_back')}
            onPress={onBack}
            variant="secondary"
            style={styles.backBtn}
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
      backgroundColor: colors.background,
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
      backgroundColor: colors.backgroundSecondary,
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
      alignItems: 'center',
    },
    backBtn: {
      minWidth: 160,
    },
  });
