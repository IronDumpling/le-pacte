import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PrecedentRule } from '../types/chain';
import { colors, typography, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';

interface PauseModalProps {
  precedentRules: PrecedentRule[];
  onSelect: (ruleIndex: number, ruleText: string) => void;
  onBack: () => void;
}

export function PauseModal({
  precedentRules,
  onSelect,
  onBack,
}: PauseModalProps) {
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();
  return (
    <Modal visible animationType="fade">
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>{t('pause_title')}</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t('pause_subtitle')}</Text>
        </View>
        <FlatList
          data={precedentRules}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => onSelect(index + 1, item.text)}
              style={({ pressed }) => [
                [styles.ruleItem, { backgroundColor: themeColors.backgroundSecondary }],
                pressed && styles.ruleItemPressed,
              ]}
            >
              <Text style={[styles.ruleText, { color: themeColors.text }]}>{item.text}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
        <View style={styles.footer}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={[styles.backText, { color: themeColors.accent }]}>{t('common_back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
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
    color: colors.text,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backText: {
    ...typography.body,
    color: colors.accent,
  },
});
