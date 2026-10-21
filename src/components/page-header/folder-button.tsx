"use client";

import { useSaveFolder } from "./hooks/use-save-folder";

export function FolderButton() {
  const { folder, picking, error, pick } = useSaveFolder();
  const label = picking ? "Tanlanmoqda…" : folder.name;

  return (
    <button
      type="button"
      onClick={() => void pick()}
      disabled={picking}
      title={error || folder.path || "Desktop"}
      aria-label={picking ? "Papka tanlanmoqda" : `Saqlash papkasi: ${folder.name}`}
      className="max-w-24 truncate text-left text-sm text-muted transition hover:text-ink disabled:opacity-60 sm:max-w-44"
    >
      {label}
    </button>
  );
}
