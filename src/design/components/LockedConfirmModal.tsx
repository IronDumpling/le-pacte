import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { HeavyButton } from './HeavyButton';
import { colors, spacing } from '../theme';
import { useTypography } from '../typography';
import { useLocale } from '../../i18n/LocaleContext';

interface LockedConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
}

export function LockedConfirmModal({
  visible,
  onConfirm,
  title,
  subtitle,
}: LockedConfirmModalProps) {
  const typography = useTypography();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const resolvedTitle = title ?? t('locked_savedTitle');
  const resolvedSubtitle = subtitle ?? t('save_confirmSubtitle');
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onConfirm}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.subtitle}>{resolvedSubtitle}</Text>
          <HeavyButton
            title={t('locked_confirm')}
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
