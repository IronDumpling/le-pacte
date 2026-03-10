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

interface PauseModalProps {
  precedentRules: PrecedentRule[];
  onSelect: () => void;
  onBack: () => void;
}

export function PauseModal({
  precedentRules,
  onSelect,
  onBack,
}: PauseModalProps) {
  return (
    <Modal visible animationType="fade">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>选择暂停原因</Text>
          <Text style={styles.subtitle}>下必为例规则</Text>
        </View>
        <FlatList
          data={precedentRules}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <Pressable
              onPress={onSelect}
              style={({ pressed }) => [
                styles.ruleItem,
                pressed && styles.ruleItemPressed,
              ]}
            >
              <Text style={styles.ruleText}>{item.text}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.list}
        />
        <View style={styles.footer}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>← 返回</Text>
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
