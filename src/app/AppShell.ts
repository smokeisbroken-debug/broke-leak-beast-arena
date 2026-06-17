export function mountAppShell(): void {
  const root = document.getElementById("app");
  if (!root) return;

  const loader = document.createElement("div");
  loader.className = "broke-loading";
  loader.textContent = "LOADING LEAK BEAST ARENA";
  root.appendChild(loader);

  window.setTimeout(() => loader.remove(), 650);
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
