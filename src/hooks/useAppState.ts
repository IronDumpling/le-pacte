import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePacteStore } from '../store/pacteStore';

/**
 * Listens to AppState changes. When app goes to background during FOCUSED,
 * immediately triggers DILEMMA. RESERVED countdown self-corrects on return
 * since it computes from reservedAt to Date.now().
 */
export function useAppState() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const store = usePacteStore.getState();

      if (appState.current === 'active' && nextState === 'background') {
        if (store.currentState === 'FOCUSED') {
          store.triggerDilemma();
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}
