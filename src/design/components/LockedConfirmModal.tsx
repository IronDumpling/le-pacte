import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { HeavyButton } from './HeavyButton';
import { colors, spacing } from '../theme';
import { useTypography } from '../typography';

interface LockedConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
}

export function LockedConfirmModal({
  visible,
  onConfirm,
  title = '已保存',
  subtitle = '该设置不可修改',
}: LockedConfirmModalProps) {
  const typography = useTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onConfirm}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <HeavyButton
            title="确定"
            onPress={onConfirm}
            variant="primary"
            style={styles.confirmBtn}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (typography: ReturnType<typeof useTypography>) =>
  StyleSheet.create({
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
  confirmBtn: {
    minWidth: 160,
  },
});
