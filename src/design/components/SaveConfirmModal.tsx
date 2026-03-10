import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { HeavyButton } from './HeavyButton';
import { colors, typography, spacing } from '../theme';

interface SaveConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SaveConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: SaveConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>确认保存？</Text>
          <Text style={styles.subtitle}>该设置不可修改</Text>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <HeavyButton
              title="确认"
              onPress={onConfirm}
              variant="primary"
              style={styles.confirmBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
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
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
  confirmBtn: {
    minWidth: 140,
  },
});
