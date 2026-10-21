const key = "save-folder";

export type SaveFolder = { path: string; name: string };

const fallback: SaveFolder = { path: "", name: "Desktop" };
let cachedRaw: string | null = null;
let cached: SaveFolder = fallback;

export function serverSaveFolder() {
  return fallback;
}

export function readSaveFolder(): SaveFolder {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    if (!raw) {
      cached = fallback;
      return cached;
    }
    const parsed = JSON.parse(raw) as Partial<SaveFolder>;
    cached = parsed.path && parsed.name ? { path: parsed.path, name: parsed.name } : fallback;
    return cached;
  } catch {
    cachedRaw = null;
    cached = fallback;
    return cached;
  }
}

export function writeSaveFolder(folder: SaveFolder) {
  localStorage.setItem(key, JSON.stringify(folder));
  window.dispatchEvent(new Event(key));
}

export function subscribeSaveFolder(listener: () => void) {
  window.addEventListener(key, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(key, listener);
    window.removeEventListener("storage", listener);
  };
}
