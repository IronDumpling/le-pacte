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

export function DilemmaModal() {
  const { chooseDestruction, chooseCompromise, returnToFocus } = usePacteStore();
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
            <Text style={styles.inputTitle}>记录本次例外</Text>
            <Text style={styles.inputHint}>
              未来的每一次专注，你都必须允许此行为
            </Text>
            <TextInput
              style={styles.input}
              placeholder="例如：中途拿快递"
              placeholderTextColor={colors.textMuted}
              value={exceptionText}
              onChangeText={setExceptionText}
              multiline
              autoFocus
            />
            <View style={styles.inputActions}>
              <Pressable onPress={handleCompromiseCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>取消</Text>
              </Pressable>
              <HeavyButton
                title="写入下必为例规则"
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
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>判例结算</Text>
          <Text style={styles.subtitle}>下必为例</Text>

          <View style={styles.options}>
            <HeavyButton
              title="承认失败，粉碎当前链条"
              onPress={handleDestruction}
              variant="destruction"
              style={styles.optionButton}
            />
            <HeavyButton
              title="允许本次违规，下必为例"
              onPress={handleCompromisePress}
              variant="secondary"
              style={styles.optionButton}
            />
            <Pressable onPress={returnToFocus} style={styles.backBtn}>
              <Text style={styles.backText}>← 返回</Text>
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
