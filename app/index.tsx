import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { usePacteStore } from '../src/store/pacteStore';
import { useAppState } from '../src/hooks/useAppState';
import { IdleScreen } from '../src/components/IdleScreen';
import { ReservedScreen } from '../src/components/ReservedScreen';
import { FocusedScreen } from '../src/components/FocusedScreen';
import { DilemmaModal } from '../src/components/DilemmaModal';
import { colors } from '../src/design/theme';

export default function Index() {
  const { currentState, lastIdleAnimation, _hydrated, hydrate } = usePacteStore();

  useAppState();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!_hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      {currentState === 'IDLE' && (
        <IdleScreen
          animateSuccess={lastIdleAnimation === 'success'}
          animateBreak={lastIdleAnimation === 'break'}
        />
      )}
      {currentState === 'RESERVED' && <ReservedScreen />}
      {currentState === 'FOCUSED' && <FocusedScreen />}
      {currentState === 'DILEMMA' && <DilemmaModal />}
    </>
  );
}
