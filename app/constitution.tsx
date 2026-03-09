import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePacteStore } from '../src/store/pacteStore';
import { colors, typography, spacing } from '../src/design/theme';

export default function ConstitutionScreen() {
  const router = useRouter();
  const { precedentLog } = usePacteStore();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>
        <Text style={styles.title}>宪法 · 判例日志</Text>
        <Text style={styles.subtitle}>下必为例 · 每一次例外都将被永久记录</Text>
      </View>
      {precedentLog.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>暂无判例</Text>
          <Text style={styles.emptyHint}>选择「允许本次违规」时会在此记录</Text>
        </View>
      ) : (
        <FlatList
          data={precedentLog}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <Text style={styles.itemIndex}>#{index + 1}</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
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
  backText: {
    ...typography.body,
    color: colors.accent,
    marginBottom: spacing.md,
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
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.title,
    color: colors.textMuted,
  },
  emptyHint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  list: {
    padding: spacing.xl,
  },
  item: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  itemIndex: {
    ...typography.chainLabel,
    color: colors.accent,
    minWidth: 32,
  },
  itemText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
});
