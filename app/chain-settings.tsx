import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePacteStore } from '../src/store/pacteStore';
import { HeavyButton } from '../src/design/components';
import { RESERVATION_OPTIONS } from '../src/types/chain';
import { colors, typography, spacing } from '../src/design/theme';

const FOCUS_OPTIONS = [
  { label: '10 秒', ms: 10 * 1000 },
  { label: '25 分钟', ms: 25 * 60 * 1000 },
  { label: '1 小时', ms: 60 * 60 * 1000 },
  { label: '2 小时', ms: 2 * 60 * 60 * 1000 },
  { label: '3 小时', ms: 3 * 60 * 60 * 1000 },
];

export default function ChainSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chains, updateChain, addPrecedentRule } = usePacteStore();

  const chain = chains.find((c) => c.id === id);
  const [theme, setTheme] = useState(chain?.theme ?? '');
  const [triggerRitual, setTriggerRitual] = useState(
    chain?.triggerRitual ?? ''
  );
  const [newRuleText, setNewRuleText] = useState('');

  if (!chain) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>链条不存在</Text>
      </SafeAreaView>
    );
  }

  const handleReservationChange = (minutes: number) => {
    updateChain(chain.id, {
      reservationDurationMs: minutes * 60 * 1000,
    });
  };

  const handleFocusChange = (ms: number) => {
    if (chain.focusTargetMs !== null) return;
    Alert.alert(
      '确认设置',
      '一旦设置，该链条的专注时间不可更改。确定要设置吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: () => updateChain(chain.id, { focusTargetMs: ms }) },
      ]
    );
  };

  const handleThemeSave = () => {
    const trimmed = theme.trim();
    if (chain.theme !== null) return;
    if (trimmed) updateChain(chain.id, { theme: trimmed });
  };

  const handleTriggerSave = () => {
    const trimmed = triggerRitual.trim();
    if (chain.triggerRitual !== null) return;
    if (trimmed) updateChain(chain.id, { triggerRitual: trimmed });
  };

  const handleAddRule = () => {
    const trimmed = newRuleText.trim();
    if (trimmed) {
      addPrecedentRule(chain.id, trimmed);
      setNewRuleText('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={16}>
            <Text style={styles.backText}>← 返回</Text>
          </Pressable>
          <Text style={styles.title}>链条设置</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>预约时间</Text>
          <View style={styles.optionsRow}>
            {RESERVATION_OPTIONS.map((min) => (
              <Pressable
                key={min}
                onPress={() => handleReservationChange(min)}
                style={[
                  styles.optionBtn,
                  chain.reservationDurationMs === min * 60 * 1000 &&
                    styles.optionBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    chain.reservationDurationMs === min * 60 * 1000 &&
                      styles.optionTextActive,
                  ]}
                >
                  {min}分
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>专注时间长度</Text>
          {chain.focusTargetMs !== null ? (
            <Text style={styles.lockedText}>
              已设置，不可更改（
              {chain.focusTargetMs < 60000
                ? `${Math.floor(chain.focusTargetMs / 1000)} 秒`
                : `${Math.floor(chain.focusTargetMs / 60000)} 分钟`}
              ）
            </Text>
          ) : (
            <View style={styles.optionsRow}>
              {FOCUS_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.ms}
                  onPress={() => handleFocusChange(opt.ms)}
                  style={styles.optionBtn}
                >
                  <Text style={styles.optionText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>主题（链条专注的目的）</Text>
          {chain.theme !== null ? (
            <Text style={styles.lockedText}>已设置：{chain.theme}</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="例如：完成工作报告"
                placeholderTextColor={colors.textMuted}
                value={theme}
                onChangeText={setTheme}
              />
              <Pressable
                onPress={handleThemeSave}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>保存（一旦设置不可更改）</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>触发仪式</Text>
          {chain.triggerRitual !== null ? (
            <Text style={styles.lockedText}>已设置：{chain.triggerRitual}</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="例如：入座、戴上耳机"
                placeholderTextColor={colors.textMuted}
                value={triggerRitual}
                onChangeText={setTriggerRitual}
              />
              <Pressable
                onPress={handleTriggerSave}
                style={styles.saveBtn}
              >
                <Text style={styles.saveText}>保存（一旦设置不可更改）</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>下必为例规则</Text>
          <TextInput
            style={styles.input}
            placeholder="例如：中途拿快递"
            placeholderTextColor={colors.textMuted}
            value={newRuleText}
            onChangeText={setNewRuleText}
          />
          <HeavyButton
            title="添加下必为例规则"
            onPress={handleAddRule}
            variant="secondary"
            style={styles.addRuleBtn}
          />
          {chain.precedentRules.length > 0 && (
            <Text style={styles.rulesCount}>
              已添加 {chain.precedentRules.length} 条规则
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
  error: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.chainLabel,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.text,
  },
  lockedText: {
    ...typography.body,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  saveBtn: {
    paddingVertical: spacing.sm,
  },
  saveText: {
    ...typography.body,
    color: colors.accent,
  },
  addRuleBtn: {
    marginTop: spacing.sm,
  },
  rulesCount: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
