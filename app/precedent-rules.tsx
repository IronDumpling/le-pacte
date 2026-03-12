import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePacteStore } from '../src/store/pacteStore';
import { colors, spacing } from '../src/design/theme';
import { useTheme } from '../src/theme/ThemeContext';
import { useTypography } from '../src/design/typography';

export default function PrecedentRulesScreen() {
  const router = useRouter();
  const { chainId } = useLocalSearchParams<{ chainId: string }>();
  const { chains } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const typography = useTypography();
  const styles = React.useMemo(
    () => createStyles(themeColors, typography),
    [themeColors, typography]
  );

  const chain = chains.find((c) => c.id === chainId);
  const rules = chain?.precedentRules ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>
        <Text style={styles.title}>下必为例规则</Text>
        <Text style={styles.subtitle}>
          每一次例外都将被永久记录 · 下必为例
        </Text>
      </View>
      {rules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无规则</Text>
          <Text style={styles.emptyHint}>
            选择「允许违规，下必为例」时会在此记录
          </Text>
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemIndex}>
                {item.nodeIndex >= 0 ? `节点 #${item.nodeIndex + 1}` : '预设'}
              </Text>
              <Text style={styles.itemText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(themeColors: any, typography: ReturnType<typeof useTypography>) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.backgroundSecondary,
  },
  backText: {
    // Navigation control → keep sans body
    ...typography.body,
    color: themeColors.accent,
    marginBottom: spacing.md,
  },
  title: {
    // Precedent rules are "case law" → serif
    ...typography.serif.title,
    color: themeColors.text,
  },
  subtitle: {
    ...typography.serif.subtitle,
    color: themeColors.textMuted,
    marginTop: spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.serif.title,
    color: themeColors.textMuted,
  },
  emptyHint: {
    ...typography.serif.body,
    color: themeColors.textMuted,
    marginTop: spacing.sm,
  },
  list: {
    padding: spacing.xl,
  },
  item: {
    backgroundColor: themeColors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemIndex: {
    ...typography.chainLabel,
    color: themeColors.accent,
    marginBottom: spacing.xs,
  },
  itemText: {
    ...typography.serif.body,
    color: themeColors.text,
  },
  });
}
