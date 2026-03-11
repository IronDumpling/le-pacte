import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  Modal,
  Dimensions,
  PanResponder,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { usePacteStore } from '../store/pacteStore';
import { HeavyButton } from '../design/components';
import { colors, spacing } from '../design/theme';
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../i18n/LocaleContext';
import { SettingsPage } from './SettingsPage';
import type { Chain } from '../types/chain';
import { useTypography } from '../design/typography';

function DashedChainLine({ style }: { style?: object }) {
  const chainNodeStyles = useChainNodeStyles();
  const dashHeight = 2;
  const segmentCount = 10;
  return (
    <View style={[chainNodeStyles.dashedLineContainer, style]}>
      {Array.from({ length: segmentCount }).map((_, i) => (
        <View
          key={i}
          style={[
            chainNodeStyles.chainLine,
            chainNodeStyles.dashedSegment,
            { marginBottom: i < segmentCount - 1 ? 1 : 0 },
          ]}
        />
      ))}
    </View>
  );
}

function formatDurationAsHhMmSs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function ChainNodeList({
  chain,
  showPendingNode,
}: {
  chain: Chain;
  showPendingNode: boolean;
}) {
  const chainNodeStyles = useChainNodeStyles();
  const { t } = useLocale();
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  const focusDuration = chain.focusTargetMs ?? 0;

  const nodes = Array.from({ length: chain.length }).map((_, i) => i);

  useEffect(() => {
    setExpandedSet(
      chain.length > 0 ? new Set([chain.length - 1]) : new Set()
    );
  }, [chain.id]);

  useEffect(() => {
    if (chain.length > 0) {
      setExpandedSet((prev) => new Set([...prev, chain.length - 1]));
    }
  }, [chain.length]);

  return (
    <ScrollView
      style={chainNodeStyles.scroll}
      contentContainerStyle={chainNodeStyles.list}
      showsVerticalScrollIndicator={false}
    >
      {chain.length === 0 && !showPendingNode ? (
        <Text style={chainNodeStyles.empty}>{t('idle_noNodes')}</Text>
      ) : (
        <>
          {nodes.map((nodeIndex) => {
            const rulesForNode = chain.precedentRules
              .map((r, i) => (r.nodeIndex === nodeIndex ? { ...r, ruleIndex: i + 1 } : null))
              .filter(Boolean) as { text: string; nodeIndex: number; ruleIndex: number }[];
            const isExpanded = expandedSet.has(nodeIndex);
            const isLast = nodeIndex === chain.length - 1;
            const metadata = chain.nodeMetadata?.[nodeIndex];
            return (
              <ChainNodeRow
                key={nodeIndex}
                nodeIndex={nodeIndex}
                isFirst={nodeIndex === 0}
                isLast={isLast}
                showLineBelow={!isLast || showPendingNode}
                useDashedLine={isLast && showPendingNode}
                rules={rulesForNode}
                focusTargetMs={focusDuration}
                extraDurationMs={metadata?.extraDurationMs}
                pauses={metadata?.pauses}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedSet((prev) => {
                    const next = new Set(prev);
                    if (next.has(nodeIndex)) next.delete(nodeIndex);
                    else next.add(nodeIndex);
                    return next;
                  })
                }
              />
            );
          })}
          {showPendingNode && (
            <PendingNodeDot
              hasNodesAbove={chain.length > 0}
              useDashedLine={chain.length > 0}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}秒`;
  return `${Math.floor(ms / 60_000)}分钟`;
}

function formatElapsedToMmSs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function ChainNodeRow({
  nodeIndex,
  isFirst,
  showLineBelow,
  useDashedLine,
  rules,
  focusTargetMs,
  extraDurationMs,
  pauses,
  isExpanded,
  onToggle,
}: {
  nodeIndex: number;
  isFirst: boolean;
  isLast?: boolean;
  showLineBelow: boolean;
  useDashedLine?: boolean;
  rules: { text: string; ruleIndex: number }[];
  focusTargetMs: number;
  extraDurationMs?: number;
  pauses?: { atElapsedMs: number; durationMs: number; ruleIndex: number }[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const chainNodeStyles = useChainNodeStyles();
  const { t } = useLocale();
  return (
    <Pressable onPress={onToggle} style={chainNodeStyles.row}>
      <View style={chainNodeStyles.chainVisual}>
        <View style={chainNodeStyles.dotRow}>
          <View style={chainNodeStyles.chainDot} />
        </View>
        {showLineBelow &&
          (useDashedLine ? (
            <DashedChainLine />
          ) : (
            <View style={chainNodeStyles.chainLine} />
          ))}
      </View>
      <View style={chainNodeStyles.details}>
        <View style={chainNodeStyles.rowHeader}>
          <Text style={chainNodeStyles.nodeLabel}>#{nodeIndex + 1}</Text>
          <Text style={chainNodeStyles.expandIcon}>
            {isExpanded ? '▲' : '▼'}
          </Text>
        </View>
          {isExpanded && (
          <View style={chainNodeStyles.expandedContent}>
            <Text style={chainNodeStyles.detailItem}>
              专注时长：{formatDurationAsHhMmSs(focusTargetMs + (extraDurationMs ?? 0))}
            </Text>
            {rules.length > 0 && (
              <>
                <Text style={chainNodeStyles.detailLabel}>{t('idle_newRule')}</Text>
                {rules.map((r) => (
                  <Text key={r.ruleIndex} style={chainNodeStyles.detailItem}>
                    下必为例规则第{r.ruleIndex}条：{r.text}
                  </Text>
                ))}
              </>
            )}
            {pauses !== undefined && pauses.length > 0 && (
              <>
                <Text style={chainNodeStyles.detailLabel}>{t('idle_pause')}</Text>
                {pauses.map((p, i) => {
                  const atMs = 'atElapsedMs' in p ? p.atElapsedMs : ((p as { atMinute?: number }).atMinute ?? 0) * 60_000;
                  return (
                    <Text key={i} style={chainNodeStyles.detailItem}>
                      在{formatElapsedToMmSs(atMs)}，暂停{formatDuration(p.durationMs)}，引用下必为例规则第{p.ruleIndex}条
                    </Text>
                  );
                })}
              </>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

function PendingNodeDot({
  hasNodesAbove,
  useDashedLine,
}: {
  hasNodesAbove: boolean;
  useDashedLine?: boolean;
}) {
  const chainNodeStyles = useChainNodeStyles();
  const { t } = useLocale();
  const dotScale = useSharedValue(1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={chainNodeStyles.pendingRow}>
      <View style={chainNodeStyles.pendingChainVisual}>
        {hasNodesAbove &&
          (useDashedLine ? (
            <DashedChainLine />
          ) : (
            <View style={chainNodeStyles.chainLine} />
          ))}
        <View style={chainNodeStyles.pendingDotRow}>
          <View style={chainNodeStyles.pendingContainer}>
            <Animated.View style={[chainNodeStyles.pendingDot, dotStyle]} />
          </View>
        </View>
      </View>
      <View style={chainNodeStyles.pendingLabelColumn}>
        <View style={chainNodeStyles.pendingLabelSpacer} />
        <Text style={chainNodeStyles.pendingLabel}>{t('idle_pending')}</Text>
      </View>
    </View>
  );
}

function useChainNodeStyles() {
  const typography = useTypography();
  return useMemo(
    () =>
      StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  list: {
    paddingVertical: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  chainVisual: {
    width: 40,
    alignItems: 'center',
  },
  dotRow: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainLine: {
    width: 3,
    flex: 1,
    minHeight: 8,
    backgroundColor: colors.accent,
  },
  chainDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rowHeader: {
    height: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeLabel: {
    ...typography.chainLabel,
    color: colors.accent,
    fontSize: 20,
  },
  expandHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
  },
  expandIcon: {
    fontSize: 14,
    color: colors.textMuted,
  },
  dashedLineContainer: {
    flex: 1,
    alignItems: 'center',
    minHeight: 12,
  },
  dashedSegment: {
    height: 2,
    minHeight: 2,
  },
  expandedContent: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
  },
  detailLabel: {
    ...typography.body,
    color: colors.accent,
    fontSize: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailItem: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    alignItems: 'stretch',
  },
  pendingChainVisual: {
    width: 40,
    alignItems: 'center',
  },
  pendingDotRow: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  pendingLabelColumn: {
    flex: 1,
    marginLeft: spacing.md,
  },
  pendingLabelSpacer: {
    flex: 1,
    minHeight: 0,
  },
  pendingLabel: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 16,
    height: 36,
    lineHeight: 36,
  },
      }),
    [typography]
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;

type FlatListItem =
  | { type: 'settings' }
  | { type: 'chain'; chain: Chain }
  | { type: 'add' }
  | { type: 'archived' };

function ChainDetailModal({
  chain,
  onClose,
}: {
  chain: Chain;
  onClose: () => void;
}) {
  const modalStyles = useModalStyles();
  const { t } = useLocale();
  const { colors: themeColors } = useTheme();
  const reservationMinutes = Math.round(chain.reservationDurationMs / 60_000);
  const focusDuration = chain.focusTargetMs
    ? formatDurationAsHhMmSs(chain.focusTargetMs)
    : '—';
  const rules = chain.precedentRules;

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable
          style={[modalStyles.content, { backgroundColor: themeColors.backgroundSecondary }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, { color: themeColors.text }]}>
              {chain.theme || t('idle_defaultTheme')}
            </Text>
            <Pressable onPress={onClose} hitSlop={16}>
              <Text style={[modalStyles.closeText, { color: themeColors.accent }]}>{t('chain_close')}</Text>
            </Pressable>
          </View>
          <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
            <Text style={[modalStyles.detailItem, { color: themeColors.textMuted }]}>
              {t('chain_reservationMinutes', { minutes: String(reservationMinutes) })}
            </Text>
            <Text style={[modalStyles.detailItem, { color: themeColors.textMuted }]}>
              {t('chain_focusDuration', { duration: focusDuration })}
            </Text>
            <Text style={[modalStyles.detailLabel, { color: themeColors.accent }]}>{t('chain_rules')}</Text>
            {rules.length === 0 ? (
              <Text style={[modalStyles.emptyRules, { color: themeColors.textMuted }]}>{t('chain_noRules')}</Text>
            ) : (
              rules.map((r, i) => (
                <View key={i} style={[modalStyles.ruleItem, { backgroundColor: themeColors.background }]}>
                  <Text style={[modalStyles.ruleIndex, { color: themeColors.accent }]}>
                    {r.nodeIndex >= 0 ? t('chain_nodeLabel', { n: String(r.nodeIndex + 1) }) : t('chain_preset')}
                  </Text>
                  <Text style={[modalStyles.ruleText, { color: themeColors.text }]}>{r.text}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function useModalStyles() {
  const typography = useTypography();
  return useMemo(
    () =>
      StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  closeText: {
    ...typography.body,
    color: colors.accent,
  },
  body: {
    maxHeight: 400,
  },
  detailItem: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.body,
    color: colors.accent,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyRules: {
    ...typography.body,
    color: colors.textMuted,
  },
  ruleItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ruleIndex: {
    ...typography.chainLabel,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  ruleText: {
    ...typography.body,
    color: colors.text,
  },
      }),
    [typography]
  );
}

interface IdleScreenProps {
  animateSuccess?: boolean;
  animateBreak?: boolean;
}

function ChainCountBadge({
  count,
  animateSuccess,
  animateBreak,
}: {
  count: number;
  animateSuccess?: boolean;
  animateBreak?: boolean;
}) {
  const styles = useIdleStyles();
  const { t } = useLocale();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const prevCount = useRef(count);

  useEffect(() => {
    if (animateSuccess) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        withSpring(1)
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [animateSuccess, count]);

  useEffect(() => {
    if (animateBreak) {
      translateX.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 80 })
      );
      opacity.value = withSequence(
        withTiming(0.8, { duration: 150 }),
        withTiming(0.2, { duration: 200 }),
        withTiming(1, { duration: 150 })
      );
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(0.85, { duration: 250 }),
        withSpring(1, { damping: 12, stiffness: 100 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [animateBreak]);

  useEffect(() => {
    if (count !== prevCount.current) {
      if (count > prevCount.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (count === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      prevCount.current = count;
    }
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.chainCountBadge, animatedStyle]}>
      <Text style={styles.chainCountLabel}>{t('chain_badgeLabel')}</Text>
      <Text style={styles.chainCountNumber}>#{count}</Text>
    </Animated.View>
  );
}

const ARCHIVE_REVEAL_HEIGHT = 80;
const ARCHIVE_SNAP_THRESHOLD = 20;
const COLLAPSE_DURATION = 300;
const MINIMIZE_DURATION = 350;

function SwipeUpPageWrapper({
  header,
  body,
  actions,
  onArchive,
  pageIndex,
  viewedIndex,
}: {
  header: React.ReactNode;
  body: React.ReactNode;
  actions: React.ReactNode;
  onArchive: () => void;
  pageIndex: number;
  viewedIndex: number;
}) {
  const styles = useIdleStyles();
  const translateY = useSharedValue(0);
  const bodyTranslateY = useSharedValue(0);
  const headerTranslateX = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const prevGesture = useRef(0);
  const hasSnappedThisGesture = useRef(false);
  const isArchiving = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isArchiving.current) return false;
        const { dy } = gestureState;
        return Math.abs(dy) > 8;
      },
      onPanResponderGrant: () => {
        prevGesture.current = translateY.value;
        hasSnappedThisGesture.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        const next = prevGesture.current + dy;
        if (hasSnappedThisGesture.current) {
          if (prevGesture.current < 0 && next > -ARCHIVE_REVEAL_HEIGHT + ARCHIVE_SNAP_THRESHOLD) {
            hasSnappedThisGesture.current = false;
            translateY.value = withTiming(0, { duration: 150 });
            prevGesture.current = 0;
          }
          return;
        }
        if (next < -ARCHIVE_SNAP_THRESHOLD) {
          hasSnappedThisGesture.current = true;
          translateY.value = withTiming(-ARCHIVE_REVEAL_HEIGHT, { duration: 150 });
          prevGesture.current = -ARCHIVE_REVEAL_HEIGHT;
        } else {
          translateY.value = Math.max(0, next);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (hasSnappedThisGesture.current) return;
        const { dy, vy } = gestureState;
        const next = prevGesture.current + dy;
        if (next < -ARCHIVE_SNAP_THRESHOLD || vy < -0.2) {
          translateY.value = withTiming(-ARCHIVE_REVEAL_HEIGHT, { duration: 150 });
        } else {
          translateY.value = withTiming(0, { duration: 150 });
        }
      },
    })
  ).current;

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleArchivePress = useCallback(() => {
    if (isArchiving.current) return;
    isArchiving.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    translateY.value = withTiming(-ARCHIVE_REVEAL_HEIGHT, { duration: 100 });
    bodyTranslateY.value = withTiming(-800, { duration: COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) }, () => {
      headerTranslateX.value = withTiming(SCREEN_WIDTH * 0.35, { duration: MINIMIZE_DURATION, easing: Easing.in(Easing.cubic) });
      headerScale.value = withTiming(0.15, { duration: MINIMIZE_DURATION, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onArchive)();
        }
      });
    });
  }, [onArchive]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateY.value,
      [0, -ARCHIVE_REVEAL_HEIGHT],
      [0, 1]
    );
    return { opacity: progress };
  });

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyTranslateY.value }],
  }));

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: headerTranslateX.value },
      { scale: headerScale.value },
    ],
  }));

  useEffect(() => {
    if (pageIndex === viewedIndex) {
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [viewedIndex, pageIndex]);

  return (
    <View style={styles.swipeUpPageContainer}>
      <Animated.View style={[styles.archiveButtonSlot, animatedButtonStyle]}>
        <Pressable
          onPress={handleArchivePress}
          style={styles.archiveIconTouchArea}
          hitSlop={16}
        >
          <MaterialIcons name="archive" size={28} color={colors.text} />
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[styles.swipeUpPageContent, animatedContentStyle]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={animatedHeaderStyle}>
          {header}
        </Animated.View>
        <Animated.View style={[styles.swipeUpBody, animatedBodyStyle]}>
          {body}
          {actions}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function ChainCard({
  chain,
  isActive,
  isConfigured,
  animateSuccess,
  animateBreak,
  onSelect,
  onShowDetail,
  cornerRadius,
}: {
  chain: Chain;
  isActive: boolean;
  isConfigured: boolean;
  animateSuccess?: boolean;
  animateBreak?: boolean;
  onSelect: () => void;
  onShowDetail?: () => void;
  cornerRadius?: number;
}) {
  const styles = useIdleStyles();
  const { t } = useLocale();
  const themeLabel = chain.theme || t('idle_defaultTheme');
  const handlePress = () => {
    if (isConfigured && onShowDetail) {
      onShowDetail();
    } else {
      onSelect();
    }
  };
  const cardStyle = [
    styles.chainCard,
    cornerRadius !== undefined && { borderRadius: cornerRadius },
  ];
  return (
    <Pressable
      onPress={handlePress}
      style={cardStyle}
    >
      <View style={styles.chainCardTop}>
        <Text style={styles.chainTheme} numberOfLines={1}>
          {themeLabel}
        </Text>
        <ChainCountBadge
          count={chain.length}
          animateSuccess={animateSuccess}
          animateBreak={animateBreak}
        />
      </View>
      <Text style={styles.chainRules}>
        {t('idle_chainRules', { count: String(chain.precedentRules.length) })}
      </Text>
    </Pressable>
  );
}

const ROW_SWIPE_BUTTON_WIDTH = 56;

function ArchivedChainRow({
  chain,
  isPinned,
  onShowDetail,
  onUnarchive,
  onDelete,
  onPin,
  onUnpin,
}: {
  chain: Chain;
  isPinned: boolean;
  onShowDetail: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
}) {
  const archivedStyles = useArchivedStyles();
  const translateX = useSharedValue(0);
  const prevGesture = useRef(0);
  const hasSnappedThisGesture = useRef(false);
  const swipeLeftReveal = ROW_SWIPE_BUTTON_WIDTH * 2;
  const swipeRightReveal = ROW_SWIPE_BUTTON_WIDTH;
  const SNAP_THRESHOLD = 10;
  const CLOSE_THRESHOLD = 10;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx } = gestureState;
        return Math.abs(dx) > 8;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        return absDx > 6 && absDx > absDy;
      },
      onPanResponderGrant: () => {
        prevGesture.current = translateX.value;
        hasSnappedThisGesture.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;
        const next = prevGesture.current + dx;
        if (hasSnappedThisGesture.current) {
          if (prevGesture.current < 0 && next > -swipeLeftReveal + CLOSE_THRESHOLD) {
            translateX.value = withTiming(0, { duration: 150 });
            prevGesture.current = 0;
          } else if (prevGesture.current > 0 && next < swipeRightReveal - CLOSE_THRESHOLD) {
            translateX.value = withTiming(0, { duration: 150 });
            prevGesture.current = 0;
          }
          return;
        }
        if (next < -SNAP_THRESHOLD) {
          hasSnappedThisGesture.current = true;
          translateX.value = withTiming(-swipeLeftReveal, { duration: 150 });
          prevGesture.current = -swipeLeftReveal;
        } else if (next > SNAP_THRESHOLD) {
          hasSnappedThisGesture.current = true;
          translateX.value = withTiming(swipeRightReveal, { duration: 150 });
          prevGesture.current = swipeRightReveal;
        } else {
          translateX.value = next;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const next = prevGesture.current + dx;
        if (hasSnappedThisGesture.current) {
          if (prevGesture.current < 0 && next > -swipeLeftReveal + CLOSE_THRESHOLD) {
            translateX.value = withTiming(0, { duration: 150 });
            prevGesture.current = 0;
          } else if (prevGesture.current > 0 && next < swipeRightReveal - CLOSE_THRESHOLD) {
            translateX.value = withTiming(0, { duration: 150 });
            prevGesture.current = 0;
          }
          return;
        }
        if (dx < -15 || vx < -0.2) {
          translateX.value = withTiming(-swipeLeftReveal, { duration: 150 });
        } else if (dx > 15 || vx > 0.2) {
          translateX.value = withTiming(swipeRightReveal, { duration: 150 });
        } else {
          translateX.value = withTiming(0, { duration: 150 });
        }
      },
    })
  ).current;

  const animatedRowStyle = useAnimatedStyle(() => {
    const rightRadius = interpolate(
      translateX.value,
      [-swipeLeftReveal, 0],
      [0, 12],
      Extrapolation.CLAMP
    );
    const leftRadius = interpolate(
      translateX.value,
      [0, swipeRightReveal],
      [12, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX: translateX.value }],
      borderTopLeftRadius: leftRadius,
      borderBottomLeftRadius: leftRadius,
      borderTopRightRadius: rightRadius,
      borderBottomRightRadius: rightRadius,
    };
  });

  const handlePinOrUnpin = () => {
    if (isPinned) {
      onUnpin();
    } else {
      onPin();
    }
    translateX.value = withTiming(0, { duration: 150 });
  };

  const handleUnarchive = () => {
    translateX.value = withTiming(
      -SCREEN_WIDTH,
      { duration: 250, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onUnarchive)();
      }
    );
  };

  return (
    <Animated.View style={archivedStyles.rowWrapper} layout={Layout.springify()}>
      <View style={archivedStyles.rowActionsLeft}>
        <Pressable style={archivedStyles.pinButton} onPress={handlePinOrUnpin}>
          <MaterialIcons
            name={isPinned ? 'bookmark' : 'push-pin'}
            size={24}
            color={colors.text}
          />
        </Pressable>
      </View>
      <View style={archivedStyles.rowActionsRight}>
        <Pressable style={archivedStyles.unarchiveButton} onPress={handleUnarchive}>
          <MaterialIcons name="unarchive" size={24} color={colors.text} />
        </Pressable>
        <Pressable style={archivedStyles.deleteButton} onPress={onDelete}>
          <MaterialIcons name="delete" size={24} color={colors.text} />
        </Pressable>
      </View>
      <Animated.View
        style={[archivedStyles.rowContent, animatedRowStyle]}
        {...panResponder.panHandlers}
      >
        <ChainCard
          chain={chain}
          isActive={false}
          isConfigured={true}
          onSelect={() => {}}
          onShowDetail={onShowDetail}
          cornerRadius={0}
        />
      </Animated.View>
    </Animated.View>
  );
}

function useArchivedStyles() {
  return useMemo(
    () =>
      StyleSheet.create({
  rowWrapper: {
    width: '100%',
    height: 160,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  rowContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    overflow: 'hidden',
  },
  rowActionsLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ROW_SWIPE_BUTTON_WIDTH,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionsRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ROW_SWIPE_BUTTON_WIDTH * 2,
    flexDirection: 'row',
  },
  pinButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  unarchiveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.destruction,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
      }),
    []
  );
}

function AddChainCard({
  onPress,
  onHaptic,
  addChainLabel,
}: {
  onPress: () => void;
  onHaptic: () => void;
  addChainLabel: string;
}) {
  const styles = useIdleStyles();
  return (
    <Pressable
      onPress={() => {
        onHaptic();
        onPress();
      }}
      style={styles.addCard}
    >
      <Text style={styles.addText}>+</Text>
      <Text style={styles.addHint}>{addChainLabel}</Text>
    </Pressable>
  );
}

export function IdleScreen({
  animateSuccess,
  animateBreak,
}: IdleScreenProps) {
  const styles = useIdleStyles();
  const modalStyles = useModalStyles();
  const router = useRouter();
  const {
    chains,
    archivedChains,
    pinnedArchivedChainIds,
    activeChainId,
    addChain,
    setActiveChain,
    reserve,
    archiveChain,
    unarchiveChain,
    deleteArchivedChain,
    pinArchivedChain,
    unpinArchivedChain,
    clearIdleAnimation,
  } = usePacteStore();
  const { colors: themeColors } = useTheme();
  const { t } = useLocale();

  const [viewedIndex, setViewedIndex] = useState<number>(0);
  const [chainDetailModalChain, setChainDetailModalChain] = useState<Chain | null>(null);
  const [deleteConfirmChain, setDeleteConfirmChain] = useState<Chain | null>(null);
  const activeChain = chains.find((c) => c.id === activeChainId);

  const displayArchivedChains = useMemo(() => {
    const pinned = pinnedArchivedChainIds
      .map((id) => archivedChains.find((c) => c.id === id))
      .filter((c): c is Chain => c != null);
    const unpinned = archivedChains.filter((c) => !pinnedArchivedChainIds.includes(c.id));
    return [...pinned, ...unpinned];
  }, [archivedChains, pinnedArchivedChainIds]);

  const flatListData: FlatListItem[] = [
    { type: 'settings' as const },
    ...chains.map((c) => ({ type: 'chain' as const, chain: c })),
    { type: 'add' as const },
    { type: 'archived' as const },
  ];

  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const hasInitialScroll = useRef(false);
  const pendingScrollToNewChain = useRef(false);

  const SETTINGS_INDEX = 0;
  const firstChainIndex = 1;
  const addPageIndex = 1 + chains.length;
  const archivedPageIndex = 2 + chains.length;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
      setViewedIndex(index);
    },
    []
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
      setViewedIndex(index);
      if (index >= firstChainIndex && index < firstChainIndex + chains.length) {
        lastHapticIndex.current = index;
        const targetChain = chains[index - firstChainIndex];
        setActiveChain(targetChain.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [chains, setActiveChain]
  );

  const handleScrollBeginDrag = useCallback(() => {
    lastHapticIndex.current = null;
  }, []);

  useEffect(() => {
    if (animateSuccess || animateBreak) {
      const t = setTimeout(clearIdleAnimation, 1500);
      return () => clearTimeout(t);
    }
  }, [animateSuccess, animateBreak, clearIdleAnimation]);

  useEffect(() => {
    if (activeChainId && chains.length > 0) {
      const chainIdx = chains.findIndex((c) => c.id === activeChainId);
      if (chainIdx >= 0) {
        lastHapticIndex.current = firstChainIndex + chainIdx;
      }
    }
  }, [activeChainId, chains]);

  useEffect(() => {
    if (chains.length === 0) {
      if (!hasInitialScroll.current) {
        hasInitialScroll.current = true;
        setViewedIndex(addPageIndex);
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({
            index: addPageIndex,
            animated: false,
          });
        });
      }
      return;
    }
    if (!activeChainId) return;
    const chainIdx = chains.findIndex((c) => c.id === activeChainId);
    if (chainIdx < 0) return;
    const idx = firstChainIndex + chainIdx;
    if (pendingScrollToNewChain.current) {
      pendingScrollToNewChain.current = false;
      setViewedIndex(idx);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true });
      });
      return;
    }
    if (!hasInitialScroll.current) {
      hasInitialScroll.current = true;
      setViewedIndex(idx);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false });
      });
    }
  }, [activeChainId, chains, addPageIndex]);

  const handleChainSelect = useCallback(
    (chain: Chain) => {
      const chainIdx = chains.findIndex((c) => c.id === chain.id);
      if (chainIdx >= 0) {
        const index = firstChainIndex + chainIdx;
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setActiveChain(chain.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [chains, setActiveChain]
  );

  const renderChainPage = ({ item, index }: { item: Chain; index: number }) => {
    const isConfigured =
      item.theme !== null && item.focusTargetMs !== null;
    const itemCanReserve = isConfigured;
    return (
      <View style={styles.pageWrapper}>
        <SwipeUpPageWrapper
          pageIndex={index}
          viewedIndex={viewedIndex}
          onArchive={() => archiveChain(item.id)}
          header={
            <View style={styles.pageHeader}>
              <ChainCard
                chain={item}
                isActive={item.id === activeChainId}
                isConfigured={isConfigured}
                animateSuccess={
                  item.id === activeChainId ? animateSuccess : undefined
                }
                animateBreak={
                  item.id === activeChainId ? animateBreak : undefined
                }
                onSelect={() => handleChainSelect(item)}
                onShowDetail={isConfigured ? () => setChainDetailModalChain(item) : undefined}
              />
            </View>
          }
          body={
            <View style={styles.pageContent}>
              {isConfigured ? (
                <ChainNodeList
                  chain={item}
                  showPendingNode={!!itemCanReserve}
                />
              ) : (
                <View style={styles.unconfiguredPlaceholder} />
              )}
            </View>
          }
          actions={
            <View style={styles.pageActions}>
              <HeavyButton
                title={itemCanReserve ? t('idle_reserve') : t('idle_configure')}
                onPress={() => {
                  if (itemCanReserve) {
                    setActiveChain(item.id);
                    reserve();
                  } else {
                    router.push({
                      pathname: '/chain-settings',
                      params: { id: item.id },
                    });
                  }
                }}
                variant="primary"
              />
            </View>
          }
        />
      </View>
    );
  };

  const renderAddPage = () => (
    <View style={styles.pageWrapper}>
      <View style={styles.pageHeader}>
        <AddChainCard
          onPress={() => {
            pendingScrollToNewChain.current = true;
            addChain();
          }}
          onHaptic={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }
          addChainLabel={t('idle_addChain')}
        />
      </View>
      <View style={styles.pageContent}>
        <View style={styles.addPagePlaceholder} />
      </View>
      <View style={styles.pageActions} />
    </View>
  );

  const isArchivedPage = viewedIndex === archivedPageIndex;

  const renderSettingsPage = () => (
    <View style={styles.pageWrapper}>
      <SettingsPage />
    </View>
  );

  const renderArchivedPage = () => (
    <View style={styles.pageWrapper}>
      <View style={styles.archivedHeader}>
        <Pressable
          onPress={() => {
            flatListRef.current?.scrollToIndex({
              index: addPageIndex,
              animated: true,
            });
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.archivedBackButton}
          hitSlop={16}
        >
          <Text style={styles.archivedBackText}>{t('common_back')}</Text>
        </Pressable>
        <Text style={[styles.archivedTitle, { color: themeColors.text }]}>{t('idle_archived')}</Text>
      </View>
      <View style={styles.archivedContent}>
        {displayArchivedChains.length === 0 ? (
          <Text style={styles.archivedEmpty}>{t('idle_archivedEmpty')}</Text>
        ) : (
          <FlatList
            data={displayArchivedChains}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ArchivedChainRow
                chain={item}
                isPinned={pinnedArchivedChainIds.includes(item.id)}
                onShowDetail={() => setChainDetailModalChain(item)}
                onUnarchive={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  unarchiveChain(item.id);
                }}
                onDelete={() => setDeleteConfirmChain(item)}
                onPin={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  pinArchivedChain(item.id);
                }}
                onUnpin={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  unpinArchivedChain(item.id);
                }}
              />
            )}
            contentContainerStyle={styles.archivedList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: FlatListItem; index: number }) => {
    if (item.type === 'settings') {
      return renderSettingsPage();
    }
    if (item.type === 'chain') {
      return renderChainPage({ item: item.chain, index });
    }
    if (item.type === 'add') {
      return renderAddPage();
    }
    return renderArchivedPage();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {chainDetailModalChain && (
        <ChainDetailModal
          chain={chainDetailModalChain}
          onClose={() => setChainDetailModalChain(null)}
        />
      )}
      {deleteConfirmChain && (
        <Modal visible transparent animationType="fade">
          <Pressable
            style={modalStyles.overlay}
            onPress={() => setDeleteConfirmChain(null)}
          >
            <Pressable
              style={[modalStyles.content, { backgroundColor: themeColors.backgroundSecondary }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[modalStyles.title, { color: themeColors.text }]}>{t('idle_permanentDelete')}</Text>
              <Text style={[modalStyles.detailItem, { color: themeColors.textMuted }]}>
                {t('idle_irreversible')}
              </Text>
              <View style={styles.deleteModalActions}>
                <Pressable
                  style={[styles.deleteModalCancel, { backgroundColor: themeColors.backgroundSecondary }]}
                  onPress={() => setDeleteConfirmChain(null)}
                >
                  <Text style={[styles.deleteModalCancelText, { color: themeColors.text }]}>{t('common_cancel')}</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteModalConfirm}
                  onPress={() => {
                    deleteArchivedChain(deleteConfirmChain.id);
                    setDeleteConfirmChain(null);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }}
                >
                  <Text style={[styles.deleteModalConfirmText, { color: themeColors.text }]}>{t('common_delete')}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
      <FlatList
        ref={flatListRef}
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.type === 'chain'
            ? item.chain.id
            : item.type === 'settings'
              ? 'settings'
              : item.type
        }
        horizontal
        pagingEnabled
        scrollEnabled={!isArchivedPage}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        style={styles.flatList}
        onScrollToIndexFailed={(info) => {
          setTimeout(
            () =>
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              }),
            100
          );
        }}
      />
    </SafeAreaView>
  );
}

function useIdleStyles() {
  const typography = useTypography();
  return useMemo(
    () =>
      StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flatList: {
    flex: 1,
  },
  pageWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  pageHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pageContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  pageActions: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  addPagePlaceholder: {
    flex: 1,
    minHeight: 120,
  },
  archivedHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  archivedBackButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  archivedBackText: {
    ...typography.body,
    color: colors.accent,
  },
  archivedTitle: {
    ...typography.title,
    color: colors.text,
  },
  archivedContent: {
    flex: 1,
    padding: spacing.lg,
  },
  archivedEmpty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  archivedList: {
    paddingBottom: spacing.xl,
  },
  deleteModalActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  deleteModalCancel: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  deleteModalCancelText: {
    ...typography.body,
    color: colors.text,
  },
  deleteModalConfirm: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.destruction,
    borderRadius: 8,
  },
  deleteModalConfirmText: {
    ...typography.body,
    color: colors.text,
  },
  chainCard: {
    width: '100%',
    height: 160,
    backgroundColor: '#1E2A3A',
    borderRadius: 12,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  chainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chainTheme: {
    ...typography.title,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  chainCountBadge: {
    alignItems: 'flex-end',
  },
  chainCountLabel: {
    ...typography.chainLabel,
    color: colors.accent,
    letterSpacing: 2,
    marginBottom: 2,
  },
  chainCountNumber: {
    ...typography.chainNumber,
    color: colors.text,
    fontSize: 36,
  },
  chainRules: {
    ...typography.body,
    color: colors.textMuted,
  },
  swipeUpPageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  archiveButtonSlot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ARCHIVE_REVEAL_HEIGHT,
    backgroundColor: '#2E4A6E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveIconTouchArea: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeUpPageContent: {
    flex: 1,
  },
  swipeUpBody: {
    flex: 1,
    overflow: 'hidden',
  },
  addCard: {
    width: '100%',
    height: 160,
    backgroundColor: '#1E2A3A',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 48,
    color: colors.accent,
  },
  addHint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  visualSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyBottom: {
    flex: 1,
  },
  unconfiguredPlaceholder: {
    flex: 1,
    minHeight: 120,
  },
  nodeScroll: {
    flex: 1,
    width: '100%',
    maxHeight: 200,
  },
  nodeList: {
    paddingVertical: spacing.md,
  },
  emptyNodes: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  nodeIndex: {
    ...typography.chainLabel,
    color: colors.accent,
    minWidth: 40,
  },
  nodeRule: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  actions: {
    padding: spacing.xl,
    alignItems: 'center',
  },
      }),
    [typography]
  );
}
