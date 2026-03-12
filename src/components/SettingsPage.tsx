import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { spacing } from '../design/theme';
import { useTypography } from '../design/typography';
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

export function SettingsPage() {
  const { colors, colorScheme, setColorScheme } = useTheme();
  const { locale, setLocale, t } = useLocale();
  const typography = useTypography();

  const styles = React.useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View style={styles.container}>
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
      </View>
    </View>
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
      borderBottomColor: colors.backgroundSecondary,
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
  });
}
