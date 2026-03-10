import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { ChainDisplay, HeavyButton } from '../design/components';
import { colors, spacing, typography } from '../design/theme';
import type { Chain } from '../types/chain';

function DashedChainLine({ style }: { style?: object }) {
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

function formatFocusDuration(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)} 秒`;
  return `${Math.floor(ms / 60_000)} 分钟`;
}

function ChainNodeList({
  chain,
  showPendingNode,
}: {
  chain: Chain;
  showPendingNode: boolean;
}) {
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
        <Text style={chainNodeStyles.empty}>暂无节点</Text>
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
                focusDuration={formatFocusDuration(focusDuration)}
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

function ChainNodeRow({
  nodeIndex,
  isFirst,
  showLineBelow,
  useDashedLine,
  rules,
  focusDuration,
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
  focusDuration: string;
  extraDurationMs?: number;
  pauses?: { atMinute: number; durationMs: number; ruleIndex: number }[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
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
              专注时长：{focusDuration}
              {extraDurationMs !== undefined && extraDurationMs > 0
                ? `（额外${formatDuration(extraDurationMs)}）`
                : ''}
            </Text>
            {rules.length > 0 && (
              <>
                <Text style={chainNodeStyles.detailLabel}>新增规则：</Text>
                {rules.map((r) => (
                  <Text key={r.ruleIndex} style={chainNodeStyles.detailItem}>
                    下必为例规则第{r.ruleIndex}条：{r.text}
                  </Text>
                ))}
              </>
            )}
            {pauses !== undefined && pauses.length > 0 && (
              <>
                <Text style={chainNodeStyles.detailLabel}>暂停：</Text>
                {pauses.map((p, i) => (
                  <Text key={i} style={chainNodeStyles.detailItem}>
                    在第{p.atMinute}分钟，暂停{formatDuration(p.durationMs)}，引用下必为例规则第{p.ruleIndex}条
                  </Text>
                ))}
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
        <Text style={chainNodeStyles.pendingLabel}>即将生成</Text>
      </View>
    </View>
  );
}

const chainNodeStyles = StyleSheet.create({
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
    width: 32,
    alignItems: 'center',
  },
  dotRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainLine: {
    width: 2,
    flex: 1,
    minHeight: 8,
    backgroundColor: colors.accent,
  },
  chainDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rowHeader: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeLabel: {
    ...typography.chainLabel,
    color: colors.accent,
  },
  expandHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 12,
  },
  expandIcon: {
    fontSize: 10,
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
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
  },
  detailLabel: {
    ...typography.body,
    color: colors.accent,
    fontSize: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailItem: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    alignItems: 'stretch',
  },
  pendingChainVisual: {
    width: 32,
    alignItems: 'center',
  },
  pendingDotRow: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
    fontSize: 12,
    height: 28,
    lineHeight: 28,
  },
});

const SCREEN_WIDTH = Dimensions.get('window').width;

interface IdleScreenProps {
  animateSuccess?: boolean;
  animateBreak?: boolean;
}

function ChainCard({
  chain,
  isActive,
  onSelect,
}: {
  chain: Chain;
  isActive: boolean;
  onSelect: () => void;
}) {
  const themeLabel = chain.theme || '专注';
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.chainCard, isActive && styles.chainCardActive]}
    >
      <Text style={styles.chainTheme} numberOfLines={1}>
        {themeLabel}
      </Text>
      <Text style={styles.chainLength}>CHAIN #{chain.length}</Text>
      <Text style={styles.chainRules}>
        下必为例 × {chain.precedentRules.length}
      </Text>
    </Pressable>
  );
}

function AddChainCard({
  onPress,
  onHaptic,
}: {
  onPress: () => void;
  onHaptic: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        onHaptic();
        onPress();
      }}
      style={styles.addCard}
    >
      <Text style={styles.addText}>+</Text>
      <Text style={styles.addHint}>添加契约链</Text>
    </Pressable>
  );
}

export function IdleScreen({
  animateSuccess,
  animateBreak,
}: IdleScreenProps) {
  const router = useRouter();
  const {
    chains,
    activeChainId,
    addChain,
    setActiveChain,
    reserve,
    clearIdleAnimation,
  } = usePacteStore();

  const [viewedIndex, setViewedIndex] = useState<number>(0);
  const viewedChain =
    viewedIndex < chains.length ? chains[viewedIndex] : null;
  const activeChain = chains.find((c) => c.id === activeChainId);
  const canReserve =
    viewedChain &&
    viewedChain.focusTargetMs !== null &&
    viewedChain.theme !== null;

  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const hasInitialScroll = useRef(false);
  const pendingScrollToNewChain = useRef(false);

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
      if (index < chains.length) {
        lastHapticIndex.current = index;
        const targetChain = chains[index];
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
      const index = chains.findIndex((c) => c.id === activeChainId);
      if (index >= 0) {
        lastHapticIndex.current = index;
      }
    }
  }, [activeChainId, chains]);

  useEffect(() => {
    if (!activeChainId || chains.length === 0) return;
    const idx = chains.findIndex((c) => c.id === activeChainId);
    if (idx < 0) return;
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
  }, [activeChainId, chains]);


  const handleMainButtonPress = () => {
    if (canReserve && viewedChain) {
      setActiveChain(viewedChain.id);
      reserve();
    } else if (viewedChain) {
      router.push({
        pathname: '/chain-settings',
        params: { id: viewedChain.id },
      });
    }
  };

  const handleChainSelect = useCallback(
    (chain: Chain) => {
      const index = chains.findIndex((c) => c.id === chain.id);
      if (index >= 0) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setActiveChain(chain.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [chains, setActiveChain]
  );

  const renderChainItem = ({ item }: { item: Chain }) => (
    <View style={styles.chainCardWrapper}>
      <ChainCard
        chain={item}
        isActive={item.id === activeChainId}
        onSelect={() => handleChainSelect(item)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.horizontalSection}>
        <FlatList
          ref={flatListRef}
          data={chains}
          renderItem={renderChainItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          onScrollBeginDrag={handleScrollBeginDrag}
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          ListFooterComponent={
            <View style={styles.chainCardWrapper}>
              <AddChainCard
                onPress={() => {
                  pendingScrollToNewChain.current = true;
                  addChain();
                }}
                onHaptic={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              />
            </View>
          }
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
      </View>

      {viewedChain ? (
        <>
          <View style={styles.visualSection}>
            {viewedChain.theme !== null &&
            viewedChain.focusTargetMs !== null ? (
              <>
                <ChainDisplay
                  count={viewedChain.length}
                  animateSuccess={
                    viewedChain.id === activeChainId
                      ? animateSuccess
                      : undefined
                  }
                  animateBreak={
                    viewedChain.id === activeChainId ? animateBreak : undefined
                  }
                />
                <ChainNodeList
                  chain={viewedChain}
                  showPendingNode={!!canReserve}
                />
              </>
            ) : (
              <View style={styles.unconfiguredPlaceholder} />
            )}
          </View>

          <View style={styles.actions}>
            <HeavyButton
              title={canReserve ? '预定契约' : '配置契约链'}
              onPress={handleMainButtonPress}
              variant="primary"
            />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/precedent-rules',
                  params: { chainId: viewedChain.id },
                })
              }
              style={styles.rulesLink}
              hitSlop={16}
            >
              <Text style={styles.rulesText}>下必为例规则</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.emptyBottom} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  horizontalSection: {
    paddingVertical: spacing.md,
  },
  chainList: {},
  chainCardWrapper: {
    width: SCREEN_WIDTH,
  },
  chainCard: {
    width: SCREEN_WIDTH,
    height: 120,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.lg,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chainCardActive: {
    borderColor: colors.primary,
  },
  chainTheme: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chainLength: {
    ...typography.chainLabel,
    color: colors.accent,
  },
  chainRules: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  addCard: {
    width: SCREEN_WIDTH,
    height: 120,
    backgroundColor: colors.backgroundSecondary,
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
  rulesLink: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  rulesText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
