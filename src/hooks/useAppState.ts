import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePacteStore } from '../store/pacteStore';

export function useAppState() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const store = usePacteStore.getState();

      if (appState.current === 'active' && nextState === 'background') {
        store.setBackgroundTimestamp(Date.now());
        if (store.currentState === 'FOCUSED') {
          store.triggerDilemma();
        }
      } else if (appState.current === 'background' && nextState === 'active') {
        const { backgroundTimestamp, currentState } = usePacteStore.getState();
        if (backgroundTimestamp !== null && currentState === 'RESERVED') {
          const elapsed = Date.now() - backgroundTimestamp;
          store.adjustReservedForBackground(elapsed);
        }
        store.setBackgroundTimestamp(null);
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}
