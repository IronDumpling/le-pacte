import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { HeavyButton } from './HeavyButton';
import { colors, spacing } from '../theme';
import { useTypography } from '../typography';
import { useLocale } from '../../i18n/LocaleContext';

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
  const typography = useTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { t } = useLocale();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{t('save_confirmTitle')}</Text>
          <Text style={styles.subtitle}>{t('save_confirmSubtitle')}</Text>
          <View style={styles.actions}>
            <HeavyButton
              title={t('common_cancel')}
              onPress={onCancel}
              variant="secondary"
              style={styles.cancelBtn}
            />
            <HeavyButton
              title={t('common_confirm')}
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  cancelBtn: {
    minWidth: 140,
  },
  confirmBtn: {
    minWidth: 140,
  },
});
