const STORAGE_KEY = "broke-leak-beast-arena-progress";

export interface LocalProgress {
  bestScore: number;
  totalRuns: number;
}

export function loadLocalProgress(): LocalProgress {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { bestScore: 0, totalRuns: 0 };

  try {
    return JSON.parse(raw) as LocalProgress;
  } catch {
    return { bestScore: 0, totalRuns: 0 };
  }
}

export function saveLocalProgress(progress: LocalProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
