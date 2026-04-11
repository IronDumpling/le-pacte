import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePacteStore } from '../src/store/pacteStore';
import {
  HeavyButton,
  LockedConfirmModal,
  SaveConfirmModal,
} from '../src/design/components';
import { RESERVATION_OPTIONS, type ReservationOption } from '../src/types/chain';
import { colors, spacing } from '../src/design/theme';
import { useTheme } from '../src/theme/ThemeContext';
import { useTypography } from '../src/design/typography';
import { useLocale } from '../src/i18n/LocaleContext';
import { useFonts } from 'expo-font';
import { getSerifFontsForLocale } from '../src/design/fonts/serifFonts';
import { EditPrecedentRuleModal } from '../src/features/chain-settings/EditPrecedentRuleModal';

const ITEM_HEIGHT = 56;
const PICKER_VISIBLE_ITEMS = 5;

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

function getReservationLabel(ms: number, t: (k: string, p?: Record<string, string>) => string): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return t('time_seconds', { n: String(seconds) });
  return t('time_minutes', { n: String(Math.round(ms / 60000)) });
}

function getInitialStep(chain: {
  reservationDurationLocked?: boolean;
  focusTargetMs: number | null;
  theme: string | null;
  triggerRitual: string | null;
}): number {
  if (!chain.reservationDurationLocked) return 0;
  if (chain.focusTargetMs === null) return 1;
  if (chain.theme === null) return 2;
  if (chain.triggerRitual === null) return 3;
  return 4;
}

function getCompletedSteps(chain: {
  reservationDurationLocked?: boolean;
  focusTargetMs: number | null;
  theme: string | null;
  triggerRitual: string | null;
}): number {
  let n = 0;
  if (chain.reservationDurationLocked) n++;
  if (chain.focusTargetMs !== null) n++;
  if (chain.theme !== null) n++;
  if (chain.triggerRitual !== null) n++;
  return n;
}

function msToHoursMinutes(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / 60000);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

export default function ChainSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { chains, updateChain, addPrecedentRule, updatePrecedentRule, deletePrecedentRule } =
    usePacteStore();
  const { colors: themeColors } = useTheme();
  const typography = useTypography();
  const { t, locale } = useLocale();
  useFonts(getSerifFontsForLocale(locale));

  const chain = chains.find((c) => c.id === id);
  const styles = useMemo(
    () => createStyles(themeColors, typography),
    [themeColors, typography]
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState(chain?.theme ?? t('idle_defaultTheme'));
  const [triggerRitual, setTriggerRitual] = useState(
    chain?.triggerRitual ?? ''
  );
  const [focusHours, setFocusHours] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(15);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [pendingSaveStep, setPendingSaveStep] = useState<
    'reservation' | 'focus' | 'theme' | 'ritual' | null
  >(null);
  const [showShortContractError, setShowShortContractError] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [addRuleInput, setAddRuleInput] = useState('');
  const [addRuleError, setAddRuleError] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<{
    originalIndex: number;
    text: string;
  } | null>(null);

  const reservationScrollRef = useRef<ScrollView>(null);
  const focusHoursScrollRef = useRef<ScrollView>(null);
  const focusMinutesScrollRef = useRef<ScrollView>(null);
  const reservationPickerInitialized = useRef(false);
  const focusPickerInitialized = useRef(false);
  const lastReservationMinutesRef = useRef<number | null>(null);
  const lastFocusHoursRef = useRef<number | null>(null);
  const lastFocusMinutesRef = useRef<number | null>(null);

  useEffect(() => {
    if (chain) {
      setCurrentStep(getInitialStep(chain));
      if (chain.focusTargetMs !== null) {
        const { hours, minutes } = msToHoursMinutes(chain.focusTargetMs);
        setFocusHours(hours);
        setFocusMinutes(minutes);
      }
      setTheme(chain.theme ?? t('idle_defaultTheme'));
      setTriggerRitual(chain.triggerRitual ?? '');
    }
  }, [chain?.id]);

  if (!chain) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>{t('chain_notFound')}</Text>
      </SafeAreaView>
    );
  }

  const completedSteps = getCompletedSteps(chain);
  const progress = completedSteps / 5;

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
    } else {
      router.back();
    }
  };

  const executeReservationSave = () => {
    updateChain(chain.id, {
      reservationDurationMs: chain.reservationDurationMs,
      reservationDurationLocked: true,
    });
    setShowSaveConfirmModal(false);
    setPendingSaveStep(null);
    handleNextStep();
  };

  const executeFocusSave = () => {
    const totalMinutes = focusHours * 60 + focusMinutes;
    const ms = totalMinutes * 60 * 1000;
    updateChain(chain.id, { focusTargetMs: ms });
    setShowSaveConfirmModal(false);
    setPendingSaveStep(null);
    handleNextStep();
  };

  const executeThemeSave = () => {
    const value = theme.trim() ? theme.trim() : t('idle_defaultTheme');
    updateChain(chain.id, { theme: value });
    setShowSaveConfirmModal(false);
    setPendingSaveStep(null);
    handleNextStep();
  };

  const executeTriggerSave = () => {
    const value = triggerRitual.trim() ? triggerRitual.trim() : t('reserved_start');
    updateChain(chain.id, { triggerRitual: value });
    setShowSaveConfirmModal(false);
    setPendingSaveStep(null);
    handleNextStep();
  };

  const handleSavePress = () => {
    if (currentStep === 0) {
      if (chain.reservationDurationLocked) {
        handleNextStep();
      } else {
        setPendingSaveStep('reservation');
        setShowSaveConfirmModal(true);
      }
    } else if (currentStep === 1) {
      if (chain.focusTargetMs !== null) {
        handleNextStep();
      } else if (focusHours === 0 && focusMinutes === 0) {
        setShowShortContractError(true);
      } else {
        setPendingSaveStep('focus');
        setShowSaveConfirmModal(true);
      }
    } else if (currentStep === 2) {
      if (chain.theme !== null) {
        handleNextStep();
      } else {
        setPendingSaveStep('theme');
        setShowSaveConfirmModal(true);
      }
    } else if (currentStep === 3) {
      if (chain.triggerRitual !== null) {
        handleNextStep();
      } else {
        setPendingSaveStep('ritual');
        setShowSaveConfirmModal(true);
      }
    }
  };

  const handleSaveConfirmModalConfirm = () => {
    if (pendingSaveStep === 'reservation') executeReservationSave();
    else if (pendingSaveStep === 'focus') executeFocusSave();
    else if (pendingSaveStep === 'theme') executeThemeSave();
    else if (pendingSaveStep === 'ritual') executeTriggerSave();
  };

  const handleAddRule = () => {
    const trimmed = addRuleInput.trim();
    if (!trimmed) {
      setAddRuleError(t('chainSettings_ruleEmpty'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    addPrecedentRule(chain.id, trimmed);
    setAddRuleInput('');
    setAddRuleError(null);
    setShowAddRuleModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditRuleSave = (newText: string) => {
    if (!editingRule) return;
    updatePrecedentRule(chain.id, editingRule.originalIndex, newText);
    setEditingRule(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEditRuleDelete = () => {
    if (!editingRule) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deletePrecedentRule(chain.id, editingRule.originalIndex);
    setEditingRule(null);
  };

  useEffect(() => {
    if (
      currentStep === 0 &&
      !chain.reservationDurationLocked &&
      reservationScrollRef.current &&
      !reservationPickerInitialized.current
    ) {
      reservationPickerInitialized.current = true;
      const idx = RESERVATION_OPTIONS.findIndex(
        (opt) => opt.durationMs === chain.reservationDurationMs
      );
      const scrollIndex = idx >= 0 ? idx : 2;
      setTimeout(() => {
        reservationScrollRef.current?.scrollTo({
          y: scrollIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
    if (currentStep !== 0) {
      reservationPickerInitialized.current = false;
    }
  }, [currentStep, chain.reservationDurationLocked, chain.reservationDurationMs]);

  useEffect(() => {
    if (
      currentStep === 1 &&
      chain.focusTargetMs === null &&
      !focusPickerInitialized.current &&
      focusHoursScrollRef.current &&
      focusMinutesScrollRef.current
    ) {
      focusPickerInitialized.current = true;
      setTimeout(() => {
        focusHoursScrollRef.current?.scrollTo({
          y: focusHours * ITEM_HEIGHT,
          animated: false,
        });
        focusMinutesScrollRef.current?.scrollTo({
          y: focusMinutes * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
    if (currentStep !== 1) {
      focusPickerInitialized.current = false;
    }
  }, [currentStep, chain.focusTargetMs, focusHours, focusMinutes]);

  const handleReservationScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, RESERVATION_OPTIONS.length - 1));
    const option = RESERVATION_OPTIONS[clamped];
    if (chain.reservationDurationMs !== option.durationMs) {
      updateChain(chain.id, { reservationDurationMs: option.durationMs });
      if (lastReservationMinutesRef.current !== option.durationMs) {
        lastReservationMinutesRef.current = option.durationMs;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleFocusHoursScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, HOURS_OPTIONS.length - 1));
    const hours = HOURS_OPTIONS[clamped];
    setFocusHours(hours);
    if (lastFocusHoursRef.current !== hours) {
      lastFocusHoursRef.current = hours;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFocusMinutesScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MINUTES_OPTIONS.length - 1));
    const minutes = MINUTES_OPTIONS[clamped];
    setFocusMinutes(minutes);
    if (lastFocusMinutesRef.current !== minutes) {
      lastFocusMinutesRef.current = minutes;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: {
        const locked = chain.reservationDurationLocked === true;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t('chainSettings_reservation')}</Text>
            <Text style={styles.sectionSubtitle}>{t('chainSettings_reservationSubtitle')}</Text>
            {locked ? (
              <Text style={[styles.lockedText, typography.chainNumber]}>
                {t('chainSettings_themeLocked', { value: getReservationLabel(chain.reservationDurationMs, t) })}
              </Text>
            ) : (
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerHighlight} />
                <ScrollView
                  ref={reservationScrollRef}
                  style={styles.pickerScroll}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleReservationScroll}
                  onScrollEndDrag={handleReservationScroll}
                >
                  {RESERVATION_OPTIONS.map((opt) => {
                    const isSelected =
                      chain.reservationDurationMs === opt.durationMs;
                    return (
                      <View key={opt.durationMs} style={styles.pickerItem}>
                        <Text
                          style={[
                            styles.pickerItemText,
                            isSelected && styles.pickerItemTextSelected,
                          ]}
                        >
                          <Text style={styles.pickerItemNumber}>
                            {getReservationLabel(opt.durationMs, t)}
                          </Text>
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        );
      }
      case 1: {
        const locked = chain.focusTargetMs !== null;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t('chainSettings_focusDuration')}</Text>
            <Text style={styles.sectionSubtitle}>{t('chainSettings_focusDurationSubtitle')}</Text>
            {locked ? (
              <Text style={[styles.lockedText, typography.chainNumber]}>
                {(() => {
                  const { hours, minutes } = msToHoursMinutes(chain.focusTargetMs!);
                  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                  return t('chainSettings_themeLocked', { value: formattedTime });
                })()}
              </Text>
            ) : (
              <View style={styles.focusTimeRow}>
                <View style={styles.focusPickerColumn}>
                  <Text style={styles.focusTimeLabel}>{t('chainSettings_hours')}</Text>
                  <View style={styles.pickerWrapper}>
                    <View style={styles.pickerHighlight} />
                    <ScrollView
                      ref={focusHoursScrollRef}
                      style={styles.pickerScroll}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      snapToAlignment="center"
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleFocusHoursScroll}
                      onScrollEndDrag={handleFocusHoursScroll}
                    >
                      {HOURS_OPTIONS.map((h) => (
                        <View key={h} style={styles.pickerItem}>
                          <Text
                            style={[
                              styles.pickerItemText,
                              h === focusHours && styles.pickerItemTextSelected,
                            ]}
                          >
                            {String(h).padStart(2, '0')}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={styles.focusColonColumn}>
                  <View style={styles.focusColonSpacer} />
                  <View style={styles.focusColonContainer}>
                    <Text style={styles.focusTimeColon}>:</Text>
                  </View>
                </View>
                <View style={styles.focusPickerColumn}>
                  <Text style={styles.focusTimeLabel}>{t('chainSettings_minutes')}</Text>
                  <View style={styles.pickerWrapper}>
                    <View style={styles.pickerHighlight} />
                    <ScrollView
                      ref={focusMinutesScrollRef}
                      style={styles.pickerScroll}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      snapToAlignment="center"
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleFocusMinutesScroll}
                      onScrollEndDrag={handleFocusMinutesScroll}
                    >
                      {MINUTES_OPTIONS.map((m) => (
                        <View key={m} style={styles.pickerItem}>
                          <Text
                            style={[
                              styles.pickerItemText,
                              m === focusMinutes && styles.pickerItemTextSelected,
                            ]}
                          >
                            {String(m).padStart(2, '0')}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            )}
          </View>
        );
      }
      case 2: {
        const locked = chain.theme !== null;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t('chainSettings_theme')}</Text>
            <Text style={styles.sectionSubtitle}>{t('chainSettings_themeSubtitle')}</Text>
            {locked ? (
              <Text style={styles.lockedText}>{t('chainSettings_themeLocked', { value: chain.theme! })}</Text>
            ) : (
              <TextInput
                style={styles.input}
                placeholder={t('chainSettings_themePlaceholder')}
                placeholderTextColor={themeColors.textMuted}
                value={theme}
                onChangeText={setTheme}
              />
            )}
          </View>
        );
      }
      case 3: {
        const locked = chain.triggerRitual !== null;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t('chainSettings_ritual')}</Text>
            <Text style={styles.sectionSubtitle}>{t('chainSettings_ritualSubtitle')}</Text>
            {locked ? (
              <Text style={styles.lockedText}>{t('chainSettings_ritualLocked', { value: chain.triggerRitual! })}</Text>
            ) : (
              <TextInput
                style={styles.input}
                placeholder={t('chainSettings_ritualPlaceholder')}
                placeholderTextColor={themeColors.textMuted}
                value={triggerRitual}
                onChangeText={setTriggerRitual}
              />
            )}
          </View>
        );
      }
      case 4: {
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>{t('chainSettings_rules')}</Text>
            <Text style={styles.rulesHint}>{t('chainSettings_rulesHint')}</Text>
            {chain.precedentRules.map((item, originalIndex) => {
              const isPreset = item.nodeIndex === -1;
              if (isPreset) {
                return (
                  <Pressable
                    key={`rule-${originalIndex}`}
                    style={styles.ruleItemRow}
                    onPress={() =>
                      setEditingRule({ originalIndex, text: item.text })
                    }
                  >
                    <View style={styles.ruleRowTextCol}>
                      <Text style={styles.ruleItemText} numberOfLines={3}>
                        {item.text}
                      </Text>
                      <Text style={styles.rulePresetBadge}>{t('chain_preset')}</Text>
                    </View>
                    <MaterialIcons name="edit" size={18} color={themeColors.primary} />
                  </Pressable>
                );
              }
              return (
                <View
                  key={`rule-${originalIndex}`}
                  style={[styles.ruleItemRow, styles.ruleItemReadOnly]}
                >
                  <View style={styles.ruleRowTextCol}>
                    <Text style={styles.ruleItemTextMuted} numberOfLines={3}>
                      {item.text}
                    </Text>
                    <Text style={styles.ruleSessionNote}>
                      {t('settings_ruleSessionOnly')}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="lock-outline"
                    size={18}
                    color={themeColors.textMuted}
                  />
                </View>
              );
            })}
            <Pressable
              style={styles.addRuleBox}
              onPress={() => setShowAddRuleModal(true)}
            >
              <Text style={styles.addRulePlus}>+</Text>
              <Text style={styles.addRuleHint}>{t('chainSettings_addRule')}</Text>
            </Pressable>
          </View>
        );
      }
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Text style={styles.backText}>{t('common_back')}</Text>
        </Pressable>
        <Text style={styles.title}>{t('chainSettings_title')}</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      <View style={styles.content}>{renderStepContent()}</View>

      <View style={styles.footer}>
        {currentStep === 4 ? (
          <HeavyButton
            title={t('common_done')}
            onPress={handleNextStep}
            variant="primary"
            style={styles.nextButton}
          />
        ) : (
          <HeavyButton
            title={t('common_save')}
            onPress={handleSavePress}
            variant="primary"
            style={styles.nextButton}
          />
        )}
      </View>

      <SaveConfirmModal
        visible={showSaveConfirmModal}
        onCancel={() => {
          setShowSaveConfirmModal(false);
          setPendingSaveStep(null);
        }}
        onConfirm={handleSaveConfirmModalConfirm}
      />

      <LockedConfirmModal
        visible={showShortContractError}
        onConfirm={() => setShowShortContractError(false)}
        title={t('chainSettings_hint')}
        subtitle={t('chainSettings_shortContract')}
      />

      <Modal visible={showAddRuleModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.addRuleOverlay}
        >
          <View style={styles.addRuleContainer}>
            <Text style={styles.addRuleTitle}>{t('chainSettings_addRuleTitle')}</Text>
            <Text style={styles.addRuleSubtitle}>
              {t('chainSettings_addRuleSubtitle')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('chainSettings_addRulePlaceholder')}
              placeholderTextColor={themeColors.textMuted}
              value={addRuleInput}
                onChangeText={(text) => {
                  setAddRuleInput(text);
                  if (addRuleError) {
                    setAddRuleError(null);
                  }
                }}
              multiline
              autoFocus
            />
            {addRuleError ? (
              <Text style={styles.errorText}>{addRuleError}</Text>
            ) : null}
            <View style={styles.addRuleActions}>
              <HeavyButton
                title={t('common_cancel')}
                onPress={() => {
                  setShowAddRuleModal(false);
                  setAddRuleInput('');
                }}
                variant="secondary"
                style={styles.addRuleCancelBtn}
              />
              <HeavyButton
                title={t('common_add')}
                onPress={handleAddRule}
                variant="primary"
                style={styles.addRuleSubmitBtn}
                disabled={!addRuleInput.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <EditPrecedentRuleModal
        visible={editingRule !== null}
        initialText={editingRule?.text ?? ''}
        onSave={handleEditRuleSave}
        onDelete={handleEditRuleDelete}
        onCancel={() => setEditingRule(null)}
      />
    </SafeAreaView>
  );
}

function createStyles(
  c: { background: string; backgroundSecondary: string; text: string; textMuted: string; accent: string; primary: string },
  typography: ReturnType<typeof useTypography>
) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  backText: {
    ...typography.body,
    color: c.accent,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: c.text,
  },
  progressBar: {
    height: 4,
    backgroundColor: c.backgroundSecondary,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: c.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.chainLabel,
    color: c.accent,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    ...typography.body,
    color: c.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  lockedText: {
    ...typography.body,
    color: c.textMuted,
  },
  pickerWrapper: {
    width: '100%',
    height: ITEM_HEIGHT * PICKER_VISIBLE_ITEMS,
    position: 'relative',
    marginTop: spacing.lg,
  },
  pickerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    backgroundColor: c.backgroundSecondary,
    borderRadius: 8,
    zIndex: 0,
  },
  pickerScroll: {
    flex: 1,
    zIndex: 1,
  },
  pickerContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    ...typography.title,
    color: c.textMuted,
    fontFamily: typography.chainNumber.fontFamily,
    textAlign: 'center',
    width: '100%',
  },
  pickerItemNumber: {
    fontFamily: typography.chainNumber.fontFamily,
  },
  pickerItemTextSelected: {
    color: c.primary,
    fontWeight: '700',
  },
  focusTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  focusPickerColumn: {
    flex: 1,
    alignItems: 'stretch',
  },
  focusTimeLabel: {
    ...typography.body,
    color: c.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  focusColonColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  focusColonSpacer: {
    height: 28,
  },
  focusColonContainer: {
    height: ITEM_HEIGHT * PICKER_VISIBLE_ITEMS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusTimeColon: {
    ...typography.chainNumber,
    fontSize: 40,
    color: c.primary,
  },
  input: {
    backgroundColor: c.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    color: c.text,
    ...typography.body,
    marginBottom: spacing.md,
  },
  rulesHint: {
    // Explain precedence principle → serif body
    ...typography.serif.body,
    color: c.textMuted,
    marginBottom: spacing.lg,
  },
  ruleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: c.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ruleItemReadOnly: {
    opacity: 0.95,
  },
  ruleRowTextCol: {
    flex: 1,
    gap: spacing.xs,
  },
  ruleItemText: {
    // Actual rule text → serif body
    ...typography.serif.body,
    color: c.text,
  },
  ruleItemTextMuted: {
    ...typography.serif.body,
    color: c.textMuted,
  },
  rulePresetBadge: {
    ...typography.body,
    fontSize: 12,
    color: c.primary,
    marginTop: spacing.xs,
  },
  ruleSessionNote: {
    ...typography.body,
    fontSize: 12,
    color: c.textMuted,
    marginTop: spacing.xs,
  },
  addRuleBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: c.textMuted,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  addRulePlus: {
    ...typography.title,
    color: c.accent,
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  addRuleHint: {
    ...typography.body,
    color: c.textMuted,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  nextButton: {
    minWidth: 200,
  },
  error: {
    ...typography.body,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  addRuleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  addRuleContainer: {
    backgroundColor: c.backgroundSecondary,
    borderRadius: 16,
    padding: spacing.xl,
  },
  addRuleTitle: {
    // "Add precedent rule" heading → serif
    ...typography.serif.title,
    color: c.text,
    marginBottom: spacing.sm,
  },
  addRuleSubtitle: {
    ...typography.serif.body,
    color: c.textMuted,
    marginBottom: spacing.lg,
  },
  addRuleActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  addRuleCancelBtn: {
    flex: 1,
    minWidth: 0,
  },
  addRuleSubmitBtn: {
    flex: 1,
    minWidth: 0,
  },
  errorText: {
    ...typography.serif.body,
    color: colors.destructionBase,
    marginTop: spacing.sm,
  },
  });
}
