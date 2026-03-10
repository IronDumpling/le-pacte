import React, { useEffect, useRef, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePacteStore } from '../store/pacteStore';
import { ChainDisplay, HeavyButton } from '../design/components';
import { colors, spacing, typography } from '../design/theme';
import type { Chain } from '../types/chain';

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
  const themeLabel = chain.theme || '未设置主题';
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
      <Text style={styles.addHint}>添加链条</Text>
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

  const activeChain = chains.find((c) => c.id === activeChainId);
  const canReserve =
    activeChain &&
    activeChain.focusTargetMs !== null &&
    activeChain.theme !== null;

  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const hasInitialScroll = useRef(false);
  const pendingScrollToNewChain = useRef(false);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = e.nativeEvent.contentOffset.x;
      const index = Math.round(offset / SCREEN_WIDTH);
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
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: true });
      });
      return;
    }
    if (!hasInitialScroll.current) {
      hasInitialScroll.current = true;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({ index: idx, animated: false });
      });
    }
  }, [activeChainId, chains]);


  const handleMainButtonPress = () => {
    if (canReserve && activeChain) {
      reserve();
    } else if (activeChain) {
      router.push({
        pathname: '/chain-settings',
        params: { id: activeChain.id },
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.horizontalSection}>
        <FlatList
          ref={flatListRef}
          data={chains}
          renderItem={renderChainItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
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

      {activeChain && (
        <>
          <View style={styles.visualSection}>
            <ChainDisplay
              count={activeChain.length}
              animateSuccess={animateSuccess}
              animateBreak={animateBreak}
            />
            <ScrollView
              style={styles.nodeScroll}
              contentContainerStyle={styles.nodeList}
              showsVerticalScrollIndicator={false}
            >
              {activeChain.length === 0 ? (
                <Text style={styles.emptyNodes}>暂无节点</Text>
              ) : (
                Array.from({ length: activeChain.length }).map((_, i) => {
                  const nodeIndex = activeChain.length - 1 - i;
                  const rule = activeChain.precedentRules.find(
                    (r) => r.nodeIndex === nodeIndex
                  );
                  return (
                    <View key={nodeIndex} style={styles.nodeItem}>
                      <Text style={styles.nodeIndex}>#{nodeIndex + 1}</Text>
                      {rule && (
                        <Text style={styles.nodeRule}>{rule.text}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>

          <View style={styles.actions}>
            <HeavyButton
              title={canReserve ? '预约启动' : '配置链条'}
              onPress={handleMainButtonPress}
              variant="primary"
            />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/precedent-rules',
                  params: { chainId: activeChain.id },
                })
              }
              style={styles.rulesLink}
              hitSlop={16}
            >
              <Text style={styles.rulesText}>下必为例规则</Text>
            </Pressable>
          </View>
        </>
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
    minHeight: 120,
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
    minHeight: 120,
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
    paddingHorizontal: spacing.xl,
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
