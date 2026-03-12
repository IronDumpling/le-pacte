import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePacteStore } from '../src/store/pacteStore';
import {
  HeavyButton,
  LockedConfirmModal,
  SaveConfirmModal,
} from '../src/design/components';
import { RESERVATION_OPTIONS } from '../src/types/chain';
import { colors, spacing } from '../src/design/theme';
import { useTheme } from '../src/theme/ThemeContext';
import { useTypography } from '../src/design/typography';

const ITEM_HEIGHT = 56;
const PICKER_VISIBLE_ITEMS = 5;

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

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
  const { chains, updateChain, addPrecedentRule } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const typography = useTypography();

  const chain = chains.find((c) => c.id === id);
  const styles = useMemo(
    () => createStyles(themeColors, typography),
    [themeColors, typography]
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [theme, setTheme] = useState(chain?.theme ?? '专注');
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
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedModalAdvances, setLockedModalAdvances] = useState(true);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [addRuleInput, setAddRuleInput] = useState('');

  const reservationScrollRef = useRef<ScrollView>(null);
  const focusHoursScrollRef = useRef<ScrollView>(null);
  const focusMinutesScrollRef = useRef<ScrollView>(null);
  const focusPickerInitialized = useRef(false);

  useEffect(() => {
    if (chain) {
      setCurrentStep(getInitialStep(chain));
      if (chain.focusTargetMs !== null) {
        const { hours, minutes } = msToHoursMinutes(chain.focusTargetMs);
        setFocusHours(hours);
        setFocusMinutes(minutes);
      }
      setTheme(chain.theme ?? '专注');
      setTriggerRitual(chain.triggerRitual ?? '');
    }
  }, [chain?.id]);

  if (!chain) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>契约链不存在</Text>
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
    const value = theme.trim() ? theme.trim() : '专注';
    updateChain(chain.id, { theme: value });
    setShowSaveConfirmModal(false);
    setPendingSaveStep(null);
    handleNextStep();
  };

  const executeTriggerSave = () => {
    const value = triggerRitual.trim() ? triggerRitual.trim() : '开始';
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
    if (trimmed) {
      addPrecedentRule(chain.id, trimmed);
      setAddRuleInput('');
      setShowAddRuleModal(false);
      setLockedModalAdvances(false);
      setShowLockedModal(true);
    }
  };

  const onLockedModalConfirm = () => {
    setShowLockedModal(false);
    if (lockedModalAdvances) {
      handleNextStep();
    }
  };

  useEffect(() => {
    if (
      currentStep === 0 &&
      !chain.reservationDurationLocked &&
      reservationScrollRef.current
    ) {
      const idx = RESERVATION_OPTIONS.findIndex(
        (m) => m * 60 * 1000 === chain.reservationDurationMs
      );
      const scrollIndex = idx >= 0 ? idx : 2;
      setTimeout(() => {
        reservationScrollRef.current?.scrollTo({
          y: scrollIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
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
    const minutes = RESERVATION_OPTIONS[clamped];
    if (chain.reservationDurationMs !== minutes * 60 * 1000) {
      updateChain(chain.id, { reservationDurationMs: minutes * 60 * 1000 });
    }
  };

  const handleFocusHoursScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, HOURS_OPTIONS.length - 1));
    setFocusHours(HOURS_OPTIONS[clamped]);
  };

  const handleFocusMinutesScroll = (
    e: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offset = e.nativeEvent.contentOffset.y;
    const index = Math.round(offset / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, MINUTES_OPTIONS.length - 1));
    setFocusMinutes(MINUTES_OPTIONS[clamped]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: {
        const locked = chain.reservationDurationLocked === true;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>预定时间</Text>
            <Text style={styles.sectionSubtitle}>
              按下预定后，契约将在多久后开始
            </Text>
            {locked ? (
              <Text style={styles.lockedText}>
                已设置：{chain.reservationDurationMs / 60000} 分钟
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
                  {RESERVATION_OPTIONS.map((min) => {
                    const isSelected =
                      chain.reservationDurationMs === min * 60 * 1000;
                    return (
                      <View key={min} style={styles.pickerItem}>
                        <Text
                          style={[
                            styles.pickerItemText,
                            isSelected && styles.pickerItemTextSelected,
                          ]}
                        >
                          {min} 分钟
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
            <Text style={styles.sectionTitle}>专注时间长度</Text>
            <Text style={styles.sectionSubtitle}>每次契约的持续时长</Text>
            {locked ? (
              <Text style={styles.lockedText}>
                已设置：
                {(() => {
                  const { hours, minutes } = msToHoursMinutes(
                    chain.focusTargetMs!
                  );
                  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                })()}
              </Text>
            ) : (
              <View style={styles.focusTimeRow}>
                <View style={styles.focusPickerColumn}>
                  <Text style={styles.focusTimeLabel}>小时</Text>
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
                  <Text style={styles.focusTimeLabel}>分钟</Text>
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
            <Text style={styles.sectionTitle}>主题</Text>
            <Text style={styles.sectionSubtitle}>本契约专注的目的。</Text>
            {locked ? (
              <Text style={styles.lockedText}>已设置：{chain.theme}</Text>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="例如：完成工作报告（留空默认为专注）"
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
            <Text style={styles.sectionTitle}>契约触发仪式</Text>
            <Text style={styles.sectionSubtitle}>
              做出这个动作时，将视作契约开始。
            </Text>
            {locked ? (
              <Text style={styles.lockedText}>已设置：{chain.triggerRitual}</Text>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="例如：入座、戴上耳机（留空默认为开始）"
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
            <Text style={styles.sectionTitle}>下必为例规则</Text>
            <Text style={styles.rulesHint}>
              每一次例外都将被永久记录 · 下必为例
            </Text>
            <FlatList
              data={chain.precedentRules}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <View style={styles.ruleItem}>
                  <Text style={styles.ruleItemText}>{item.text}</Text>
                </View>
              )}
              ListFooterComponent={
                <Pressable
                  style={styles.addRuleBox}
                  onPress={() => setShowAddRuleModal(true)}
                >
                  <Text style={styles.addRulePlus}>+</Text>
                  <Text style={styles.addRuleHint}>添加规则</Text>
                </Pressable>
              }
              scrollEnabled={false}
            />
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
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>
        <Text style={styles.title}>契约链设置</Text>
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
            title="完成"
            onPress={handleNextStep}
            variant="primary"
            style={styles.nextButton}
          />
        ) : (
          <HeavyButton
            title="保存"
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
        title="提示"
        subtitle="你不能缔结这样短暂的契约"
      />

      <LockedConfirmModal
        visible={showLockedModal}
        onConfirm={onLockedModalConfirm}
      />

      <Modal visible={showAddRuleModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.addRuleOverlay}
        >
          <View style={styles.addRuleContainer}>
            <Text style={styles.addRuleTitle}>添加下必为例规则</Text>
            <Text style={styles.addRuleSubtitle}>
              添加后不可修改或删除
            </Text>
            <TextInput
              style={styles.input}
              placeholder="例如：中途拿快递"
              placeholderTextColor={themeColors.textMuted}
              value={addRuleInput}
              onChangeText={setAddRuleInput}
              multiline
              autoFocus
            />
            <View style={styles.addRuleActions}>
              <Pressable
                onPress={() => {
                  setShowAddRuleModal(false);
                  setAddRuleInput('');
                }}
                style={styles.addRuleCancelBtn}
              >
                <Text style={styles.addRuleCancelText}>取消</Text>
              </Pressable>
              <HeavyButton
                title="添加"
                onPress={handleAddRule}
                variant="primary"
                style={styles.addRuleSubmitBtn}
                disabled={!addRuleInput.trim()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    alignItems: 'center',
  },
  focusTimeLabel: {
    ...typography.body,
    color: c.textMuted,
    marginBottom: spacing.sm,
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
  ruleItem: {
    backgroundColor: c.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ruleItemText: {
    // Actual rule text → serif body
    ...typography.serif.body,
    color: c.text,
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
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  addRuleCancelBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  addRuleCancelText: {
    ...typography.body,
    color: c.textMuted,
  },
  addRuleSubmitBtn: {
    minWidth: 140,
  },
  });
}
