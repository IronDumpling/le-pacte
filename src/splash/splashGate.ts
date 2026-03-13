import * as SplashScreen from 'expo-splash-screen';

const MIN_SPLASH_DURATION_MS = 1000;

let splashStartTs = Date.now();
let hasPreventedAutoHide = false;
let hasRequestedHide = false;

export function ensureSplashPrevented(): void {
  if (hasPreventedAutoHide) return;
  hasPreventedAutoHide = true;
  splashStartTs = Date.now();

  // Fire and forget; any error here只影响开发环境日志，不影响主流程
  SplashScreen.preventAutoHideAsync().catch(() => {
    // ignore – 在原生层或开发环境失败时不阻塞应用启动
  });
}

export function markAppReady(): void {
  if (hasRequestedHide) return;
  hasRequestedHide = true;

  const elapsed = Date.now() - splashStartTs;
  const remaining = MIN_SPLASH_DURATION_MS - elapsed;

  const hide = () => {
    SplashScreen.hideAsync().catch(() => {
      // ignore – 在极端情况下失败时，不再重试
    });
  };

  if (remaining > 0) {
    setTimeout(hide, remaining);
  } else {
    hide();
  }
}

