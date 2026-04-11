import * as SplashScreen from 'expo-splash-screen';

const MIN_SPLASH_DURATION_MS = 1000;

let splashStartTs = Date.now();
let hasRequestedHide = false;
/** Set by prepareSplashScreen(); must resolve before hideAsync on iOS */
let preventAutoHidePromise: Promise<boolean> | null = null;

/**
 * Call once from RootLayout after mount — awaits native registration before children render.
 */
export function prepareSplashScreen(): Promise<void> {
  if (preventAutoHidePromise) {
    return preventAutoHidePromise.then(() => {}).catch(() => {});
  }
  splashStartTs = Date.now();
  preventAutoHidePromise = SplashScreen.preventAutoHideAsync();
  return preventAutoHidePromise.then(() => {}).catch(() => {});
}

async function ensureNativeSplashRegistered(): Promise<void> {
  try {
    if (preventAutoHidePromise) {
      await preventAutoHidePromise.catch(() => {});
    } else {
      await SplashScreen.preventAutoHideAsync().catch(() => {});
    }
  } catch {
    // ignore
  }
}

async function hideSplash(): Promise<void> {
  await ensureNativeSplashRegistered();
  try {
    await SplashScreen.hideAsync();
  } catch {
    // ignore
  }
}

export function markAppReady(): void {
  if (hasRequestedHide) return;
  hasRequestedHide = true;

  const elapsed = Date.now() - splashStartTs;
  const remaining = MIN_SPLASH_DURATION_MS - elapsed;

  const runHide = () => {
    void hideSplash().catch(() => {});
  };

  if (remaining > 0) {
    setTimeout(runHide, remaining);
  } else {
    runHide();
  }
}
