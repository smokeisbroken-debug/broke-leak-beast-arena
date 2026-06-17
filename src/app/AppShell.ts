type TelegramWebApp = {
  expand?: () => void;
  ready?: () => void;
  disableVerticalSwipes?: () => void;
  requestFullscreen?: () => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type ViewportSyncGame = {
  scale?: {
    refresh?: () => void;
    updateBounds?: () => void;
  };
};

const PUBLIC_GAME_URL = "https://broke-leak-beast-arena.vercel.app/";
const VIEWPORT_SYNC_EVENT = "broke:viewport-sync";

export function mountAppShell(): void {
  const root = document.getElementById("app");
  if (!root) return;

  syncViewportHeight();
  window.addEventListener("resize", syncViewportHeight, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(syncViewportHeight, 120), { passive: true });
  window.visualViewport?.addEventListener("resize", syncViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncViewportHeight, { passive: true });

  setupTelegramWebApp();
  createLoadingOverlay(root);
  createMobileAccessOverlay(root);
}

export function bindGameViewportSync(game: ViewportSyncGame): void {
  const refresh = () => {
    window.setTimeout(() => {
      try {
        game.scale?.updateBounds?.();
        game.scale?.refresh?.();
      } catch {
        // Scale refresh is best-effort. The game still runs if a browser blocks it.
      }
    }, 60);
  };

  window.addEventListener(VIEWPORT_SYNC_EVENT, refresh);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("orientationchange", refresh, { passive: true });
  window.visualViewport?.addEventListener("resize", refresh, { passive: true });
  refresh();
}

function setupTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  try {
    webApp?.ready?.();
    webApp?.expand?.();
    webApp?.disableVerticalSwipes?.();
  } catch {
    // Telegram WebApp APIs are optional. The game must still load in a normal browser.
  }
}

function createLoadingOverlay(root: HTMLElement): void {
  const loader = document.createElement("div");
  loader.className = "broke-loading";
  loader.textContent = "LOADING LEAK BEAST ARENA";
  root.appendChild(loader);

  window.setTimeout(() => loader.remove(), 650);
}

function createMobileAccessOverlay(root: HTMLElement): void {
  const overlay = document.createElement("div");
  overlay.className = "broke-access-overlay";

  const card = document.createElement("div");
  card.className = "broke-access-card";

  const title = document.createElement("div");
  title.className = "broke-access-title";
  title.textContent = "Rotate phone for battle";

  const body = document.createElement("div");
  body.className = "broke-access-body";
  body.textContent = "If Telegram does not fit the screen, open the game in your browser.";

  const actions = document.createElement("div");
  actions.className = "broke-access-actions";

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.textContent = "Open browser";
  openButton.addEventListener("click", () => openGameLink());

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy link";
  copyButton.addEventListener("click", async () => {
    const copied = await copyGameLink();
    copyButton.textContent = copied ? "Copied" : "Copy failed";
    window.setTimeout(() => {
      copyButton.textContent = "Copy link";
    }, 1400);
  });

  const continueButton = document.createElement("button");
  continueButton.type = "button";
  continueButton.textContent = "Continue";
  continueButton.addEventListener("click", () => {
    overlay.classList.add("broke-access-hidden");
    void requestAppFullscreen(document.documentElement);
    window.dispatchEvent(new Event(VIEWPORT_SYNC_EVENT));
  });

  actions.append(openButton, copyButton, continueButton);
  card.append(title, body, actions);
  overlay.appendChild(card);
  root.appendChild(overlay);

  const updateVisibility = () => {
    const isSmallScreen = Math.min(window.innerWidth, window.innerHeight) < 520;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    overlay.classList.toggle("broke-access-visible", isSmallScreen && isPortrait);
  };

  updateVisibility();
  window.addEventListener("resize", updateVisibility, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(updateVisibility, 120), { passive: true });
  window.visualViewport?.addEventListener("resize", updateVisibility, { passive: true });
}

function syncViewportHeight(): void {
  const viewportHeight = Math.max(1, window.visualViewport?.height ?? window.innerHeight);
  const viewportWidth = Math.max(1, window.visualViewport?.width ?? window.innerWidth);
  document.documentElement.style.setProperty("--app-height", `${Math.round(viewportHeight)}px`);
  document.documentElement.style.setProperty("--app-width", `${Math.round(viewportWidth)}px`);
  document.documentElement.classList.toggle("broke-landscape", viewportWidth >= viewportHeight);
  document.documentElement.classList.toggle("broke-portrait", viewportWidth < viewportHeight);
  window.dispatchEvent(new Event(VIEWPORT_SYNC_EVENT));
}

function getTelegramWebApp(): TelegramWebApp | undefined {
  return (window as TelegramWindow).Telegram?.WebApp;
}

function openGameLink(): void {
  const webApp = getTelegramWebApp();
  try {
    webApp?.openLink?.(PUBLIC_GAME_URL, { try_instant_view: false });
    if (webApp?.openLink) return;
  } catch {
    // Fall back to browser open below.
  }

  window.open(PUBLIC_GAME_URL, "_blank", "noopener,noreferrer");
}

async function copyGameLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(PUBLIC_GAME_URL);
    return true;
  } catch {
    return false;
  }
}

export function isAppFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function requestAppFullscreen(target?: HTMLElement | null): Promise<boolean> {
  const webApp = getTelegramWebApp();
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
