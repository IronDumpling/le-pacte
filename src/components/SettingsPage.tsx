import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { spacing } from '../design/theme';
import { useTypography } from '../design/typography';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import type { ColorScheme } from '../storage/storage';
import type { Locale } from '../storage/storage';

const OPTION_HEIGHT = 48;

const COLOR_OPTIONS: { value: ColorScheme; labelKey: string; icon: string }[] = [
  { value: 'light', labelKey: 'settings_color_light', icon: 'wb-sunny' },
  { value: 'dark', labelKey: 'settings_color_dark', icon: 'nights-stay' },
  { value: 'auto', labelKey: 'settings_color_auto', icon: 'brightness-auto' },
];

const LOCALE_OPTIONS: { value: Locale; labelKey: string; flag: string }[] = [
  { value: 'zh', labelKey: 'settings_language_zh', flag: '🇨🇳' },
  { value: 'en', labelKey: 'settings_language_en', flag: '🇺🇸' },
  { value: 'fr', labelKey: 'settings_language_fr', flag: '🇫🇷' },
  { value: 'ja', labelKey: 'settings_language_ja', flag: '🇯🇵' },
];

interface EditRuleModalProps {
  visible: boolean;
  initialText: string;
  onSave: (newText: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function EditRuleModal({ visible, initialText, onSave, onDelete, onCancel }: EditRuleModalProps) {
  const [text, setText] = React.useState(initialText);
  const [error, setError] = React.useState<string | null>(null);
  const { colors } = useTheme();
  const { t } = useLocale();
  const typography = useTypography();

  React.useEffect(() => {
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
        <Pressable
          style={[editStyles.overlay]}
          onPress={onCancel}
        >
          <Pressable
            style={[editStyles.container, { backgroundColor: colors.backgroundSecondary }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[editStyles.title, { color: colors.text, ...typography.title }]}>
              {t('settings_editRule')}
            </Text>
            <TextInput
              style={[
                editStyles.input,
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
              <Text style={[editStyles.error, { color: '#E05252' }]}>{error}</Text>
            ) : null}
            <View style={editStyles.actions}>
              <Pressable
                style={[editStyles.deleteBtn, { backgroundColor: '#E05252' }]}
                onPress={onDelete}
              >
                <Text style={[editStyles.deleteBtnText, { color: '#fff', ...typography.body }]}>
                  {t('settings_deleteRule')}
                </Text>
              </Pressable>
            </View>
            <View style={editStyles.actions}>
              <HeavyButton
                title={t('common_cancel')}
                onPress={onCancel}
                variant="secondary"
                style={editStyles.btn}
              />
              <HeavyButton
                title={t('common_save')}
                onPress={handleSave}
                variant="primary"
                style={editStyles.btn}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editStyles = StyleSheet.create({
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

export function SettingsPage() {
  const { colors, colorScheme, setColorScheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const typography = useTypography();
  const { chains, activeChainId, deletePrecedentRule, updatePrecedentRule } = usePacteStore();

  const activeChain = chains.find((c) => c.id === activeChainId);
  const presetRules = activeChain
    ? activeChain.precedentRules
        .map((r, i) => ({ ...r, originalIndex: i }))
        .filter((r) => r.nodeIndex === -1)
    : [];

  const [editingRule, setEditingRule] = useState<{
    originalIndex: number;
    text: string;
  } | null>(null);

  const styles = React.useMemo(() => createStyles(colors, typography), [colors, typography]);

  const handleRulePress = (originalIndex: number, text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingRule({ originalIndex, text });
  };

  const handleSaveRule = (newText: string) => {
    if (!editingRule || !activeChainId) return;
    updatePrecedentRule(activeChainId, editingRule.originalIndex, newText);
    setEditingRule(null);
  };

  const handleDeleteRule = () => {
    if (!editingRule || !activeChainId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deletePrecedentRule(activeChainId, editingRule.originalIndex);
    setEditingRule(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings_title')}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings_color')}</Text>
          {COLOR_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.option,
                colorScheme === opt.value && styles.optionSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setColorScheme(opt.value);
              }}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons
                  name={opt.icon as 'wb-sunny' | 'nights-stay' | 'brightness-auto'}
                  size={22}
                  color={colorScheme === opt.value ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.optionText,
                    colorScheme === opt.value && styles.optionTextSelected,
                  ]}
                >
                  {t(opt.labelKey)}
                </Text>
              </View>
              {colorScheme === opt.value && (
                <MaterialIcons
                  name="check"
                  size={24}
                  color={colors.primary}
                />
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings_language')}</Text>
          {LOCALE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.option,
                locale === opt.value && styles.optionSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLocale(opt.value);
              }}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.flag}>{opt.flag}</Text>
                <Text
                  style={[
                    styles.optionText,
                    locale === opt.value && styles.optionTextSelected,
                  ]}
                >
                  {t(opt.labelKey)}
                </Text>
              </View>
              {locale === opt.value && (
                <MaterialIcons
                  name="check"
                  size={24}
                  color={colors.primary}
                />
              )}
            </Pressable>
          ))}
        </View>

        {activeChain && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings_presetRules')}</Text>
            {presetRules.length === 0 ? (
              <Text style={styles.emptyRules}>{t('settings_presetRulesEmpty')}</Text>
            ) : (
              presetRules.map((r) => (
                <Pressable
                  key={r.originalIndex}
                  style={[styles.ruleItem]}
                  onPress={() => handleRulePress(r.originalIndex, r.text)}
                >
                  <Text style={styles.ruleText} numberOfLines={2}>{r.text}</Text>
                  <MaterialIcons name="edit" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>

      <EditRuleModal
        visible={editingRule !== null}
        initialText={editingRule?.text ?? ''}
        onSave={handleSaveRule}
        onDelete={handleDeleteRule}
        onCancel={() => setEditingRule(null)}
      />
    </ScrollView>
  );
}

function createStyles(
  colors: {
  background: string;
  backgroundSecondary: string;
  text: string;
  textMuted: string;
  primary: string;
},
  typography: ReturnType<typeof useTypography>
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.textMuted,
      alignItems: 'center',
    },
    title: {
      ...typography.title,
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      fontSize: 14,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: OPTION_HEIGHT,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    flag: {
      fontSize: 22,
    },
    optionSelected: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    optionText: {
      ...typography.body,
      color: colors.text,
    },
    optionTextSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: OPTION_HEIGHT,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.xs,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      gap: spacing.sm,
    },
    ruleText: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    emptyRules: {
      ...typography.body,
      color: colors.textMuted,
      fontSize: 14,
    },
  });
}
