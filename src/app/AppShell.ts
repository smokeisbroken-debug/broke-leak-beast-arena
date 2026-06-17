type TelegramWebApp = {
  expand?: () => void;
  ready?: () => void;
  disableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

export function mountAppShell(): void {
  const root = document.getElementById("app");
  if (!root) return;

  syncViewportHeight();
  window.addEventListener("resize", syncViewportHeight);
  window.visualViewport?.addEventListener("resize", syncViewportHeight);
  window.visualViewport?.addEventListener("scroll", syncViewportHeight);

  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  try {
    webApp?.ready?.();
    webApp?.expand?.();
    webApp?.disableVerticalSwipes?.();
  } catch {
    // Telegram WebApp APIs are optional. The game must still load in a normal browser.
  }

  const loader = document.createElement("div");
  loader.className = "broke-loading";
  loader.textContent = "LOADING LEAK BEAST ARENA";
  root.appendChild(loader);

  const rotateHint = document.createElement("div");
  rotateHint.className = "broke-rotate-hint";
  rotateHint.textContent = "Rotate phone for battle";
  root.appendChild(rotateHint);

  window.setTimeout(() => loader.remove(), 650);
}

function syncViewportHeight(): void {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
  document.documentElement.style.setProperty("--app-width", `${Math.round(window.visualViewport?.width ?? window.innerWidth)}px`);
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

export function isAppFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function requestAppFullscreen(target?: HTMLElement | null): Promise<boolean> {
  const webApp = (window as TelegramWindow).Telegram?.WebApp;
  try {
    webApp?.expand?.();
    webApp?.requestFullscreen?.();
  } catch {
    // Keep browser fallback below.
  }

  const element = (target ?? document.documentElement) as FullscreenElement | null;
  if (!element) return false;
  if (isAppFullscreen()) return true;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return true;
    }

    if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export async function toggleAppFullscreen(target?: HTMLElement | null): Promise<boolean> {
  const doc = document as FullscreenDocument;

  if (isAppFullscreen()) {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return false;
      }
      if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
        return false;
      }
    } catch {
      return true;
    }
    return true;
  }

  return requestAppFullscreen(target);
}
