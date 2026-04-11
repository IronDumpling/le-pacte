import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useFonts } from 'expo-font';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { useTypography } from '../design/typography';
import { getSerifFontsForLocale } from '../design/fonts/serifFonts';
import { HeavyButton } from '../design/components';
import { spacing } from '../design/theme';

const TOTAL_STEPS = 7;
const STEP_INDICES = [0, 1, 2, 3, 4, 5, 6];

interface OnboardingModalProps {
  onDone: () => void;
}

export function OnboardingModal({ onDone }: OnboardingModalProps) {
  const { colors: themeColors } = useTheme();
  const { t, locale } = useLocale();
  const typography = useTypography();
  const { width: screenWidth } = useWindowDimensions();
  const [serifLoaded] = useFonts(getSerifFontsForLocale(locale));
  const [pageIndex, setPageIndex] = useState(0);
  const listRef = useRef<FlatList<number>>(null);

  const styles = useMemo(
    () => makeStyles(themeColors, typography, serifLoaded),
    [themeColors, typography, serifLoaded]
  );

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDone();
  }, [onDone]);

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDone();
  }, [onDone]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / Math.max(screenWidth, 1));
      setPageIndex(Math.min(Math.max(idx, 0), TOTAL_STEPS - 1));
    },
    [screenWidth]
  );

  const renderStepBody = useCallback(
    (step: number) => {
      switch (step) {
        case 0:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('onboarding_step0_title')}</Text>
              <Text style={styles.stepBody}>{t('onboarding_step0_body')}</Text>
            </View>
          );
        case 1:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('onboarding_step1_title')}</Text>
              <Text style={styles.stepBody}>{t('onboarding_step1_body')}</Text>
            </View>
          );
        case 2:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('onboarding_step2_title')}</Text>
              <View style={styles.threeSteps}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepPillNumber}>1</Text>
                  <Text style={styles.stepPillLabel}>{t('onboarding_step2_reserve')}</Text>
                </View>
                <Text style={styles.stepArrow}>→</Text>
                <View style={styles.stepPill}>
                  <Text style={styles.stepPillNumber}>2</Text>
                  <Text style={styles.stepPillLabel}>{t('onboarding_step2_focus')}</Text>
                </View>
                <Text style={styles.stepArrow}>→</Text>
                <View style={styles.stepPill}>
                  <Text style={styles.stepPillNumber}>3</Text>
                  <Text style={styles.stepPillLabel}>{t('onboarding_step2_dilemma')}</Text>
                </View>
              </View>
            </View>
          );
        case 3:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>{t('onboarding_step2_reserve')}</Text>
              <Text style={styles.stepTitle}>{t('onboarding_step3_title')}</Text>
              <Text style={styles.stepBody}>{t('onboarding_step3_body')}</Text>
            </View>
          );
        case 4:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>{t('onboarding_step2_focus')}</Text>
              <Text style={styles.stepTitle}>{t('onboarding_step4_title')}</Text>
              <Text style={styles.stepBody}>{t('onboarding_step4_body')}</Text>
            </View>
          );
        case 5:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>{t('onboarding_step2_dilemma')}</Text>
              <Text style={styles.stepTitle}>{t('onboarding_step5_title')}</Text>
              <View style={styles.dilemmaBlock}>
                <Text style={styles.abandonText}>{t('onboarding_step5_body_abandon')}</Text>
                <Text style={styles.pauseText}>{t('onboarding_step5_body_pause')}</Text>
              </View>
            </View>
          );
        case 6:
          return (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('onboarding_step6_title')}</Text>
            </View>
          );
        default:
          return null;
      }
    },
    [styles, t]
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <View style={[styles.page, { width: screenWidth }]}>
        {renderStepBody(item)}
      </View>
    ),
    [renderStepBody, screenWidth, styles]
  );

  const keyExtractor = useCallback((item: number) => String(item), []);

  return (
    <Modal visible animationType="fade">
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.skipPressable, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          style={styles.list}
          data={STEP_INDICES}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="start"
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEP_INDICES.map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === pageIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {pageIndex === TOTAL_STEPS - 1 ? (
            <HeavyButton
              title={t('onboarding_start')}
              onPress={handleStart}
              variant="primary"
              style={styles.startBtn}
            />
          ) : (
            <View style={styles.startBtnPlaceholder} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const makeStyles = (
  themeColors: {
    background: string;
    backgroundSecondary: string;
    text: string;
    textMuted: string;
    accent: string;
    primary: string;
    destructionBase: string;
  },
  typography: ReturnType<typeof useTypography>,
  serifLoaded: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      minHeight: 44,
    },
    skipPressable: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    skipText: {
      ...typography.body,
      color: themeColors.textMuted,
      fontSize: 16,
    },
    list: {
      flex: 1,
    },
    page: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    stepContent: {
      alignItems: 'center',
    },
    stepLabel: {
      ...typography.body,
      color: themeColors.accent,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontSize: 13,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    stepTitle: serifLoaded
      ? {
          ...typography.serif.title,
          color: themeColors.text,
          textAlign: 'center',
          marginBottom: spacing.xl,
        }
      : {
          ...typography.title,
          color: themeColors.text,
          textAlign: 'center',
          marginBottom: spacing.xl,
        },
    stepBody: {
      ...typography.body,
      color: themeColors.textMuted,
      textAlign: 'center',
      lineHeight: 26,
      fontSize: 17,
    },
    threeSteps: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    stepPill: {
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: themeColors.backgroundSecondary,
      borderRadius: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minWidth: 80,
    },
    stepPillNumber: {
      ...typography.chainLabel,
      color: themeColors.accent,
      fontSize: 22,
    },
    stepPillLabel: {
      ...typography.body,
      color: themeColors.text,
      fontSize: 14,
      textAlign: 'center',
    },
    stepArrow: {
      ...typography.body,
      color: themeColors.textMuted,
      fontSize: 18,
    },
    dilemmaBlock: {
      gap: spacing.lg,
      marginTop: spacing.sm,
      width: '100%',
    },
    abandonText: {
      ...typography.body,
      color: themeColors.destructionBase,
      textAlign: 'center',
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '600',
    },
    pauseText: {
      ...typography.body,
      color: themeColors.textMuted,
      textAlign: 'center',
      fontSize: 17,
      lineHeight: 26,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
      alignItems: 'center',
      gap: spacing.lg,
    },
    dots: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      backgroundColor: themeColors.accent,
      width: 18,
    },
    dotInactive: {
      backgroundColor: themeColors.textMuted,
      opacity: 0.4,
    },
    startBtn: {
      minWidth: 200,
    },
    startBtnPlaceholder: {
      minHeight: 48,
    },
  });
