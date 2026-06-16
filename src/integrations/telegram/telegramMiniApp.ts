import type { TelegramLaunchContext } from "../../game/types/telegram";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        HapticFeedback?: {
          impactOccurred?: (style: "light" | "medium" | "heavy") => void;
        };
      };
    };
  }
}

export function getTelegramContext(): TelegramLaunchContext {
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return { isTelegram: false };
  }

  webApp.ready?.();
  webApp.expand?.();

  return {
    isTelegram: true,
    initData: webApp.initData,
  };
}

export function hapticLight(): void {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
}
