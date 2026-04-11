import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useLocale } from '../../i18n/LocaleContext';
import { useTypography } from '../../design/typography';
import { HeavyButton } from '../../design/components';
import { spacing } from '../../design/theme';

export interface EditPrecedentRuleModalProps {
  visible: boolean;
  initialText: string;
  onSave: (newText: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

/**
 * 链条「例外规则」的编辑/删除弹窗。
 *
 * 唯一挂载点：`app/chain-settings.tsx` 第 4 步。不在 Settings、Idle 或其它界面使用；
 * `updatePrecedentRule` / `deletePrecedentRule` 仅应在此屏幕经本组件触发。
 */
export function EditPrecedentRuleModal({
  visible,
  initialText,
  onSave,
  onDelete,
  onCancel,
}: EditPrecedentRuleModalProps) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const { t } = useLocale();
  const typography = useTypography();

  useEffect(() => {
    if (visible) {
      setText(initialText);
      setError(null);
    }
  }, [visible, initialText]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError(t('chainSettings_ruleEmpty'));
      return;
    }
    onSave(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={styles.overlay} onPress={onCancel}>
          <Pressable
            style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.title, { color: colors.text, ...typography.title }]}>
              {t('chainSettings_editRule')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...typography.body,
                },
              ]}
              value={text}
              onChangeText={(v) => {
                setText(v);
                if (error) setError(null);
              }}
              multiline
              autoFocus
              placeholderTextColor={colors.textMuted}
            />
            {error ? (
              <Text style={[styles.error, { color: colors.destructionBase }]}>{error}</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={[styles.deleteBtn, { backgroundColor: colors.destructionBase }]}
                onPress={onDelete}
              >
                <Text style={[styles.deleteBtnText, { color: '#fff', ...typography.body }]}>
                  {t('chainSettings_deleteRule')}
                </Text>
              </Pressable>
            </View>
            <View style={styles.actions}>
              <HeavyButton
                title={t('common_cancel')}
                onPress={onCancel}
                variant="secondary"
                style={styles.btn}
              />
              <HeavyButton
                title={t('common_save')}
                onPress={handleSave}
                variant="primary"
                style={styles.btn}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    borderRadius: 12,
    padding: spacing.xl,
  },
  title: {
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  error: {
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    minWidth: 0,
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontWeight: '600',
  },
});
