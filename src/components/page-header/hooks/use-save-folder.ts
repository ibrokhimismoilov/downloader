"use client";

import { useState, useSyncExternalStore } from "react";
import type { DesktopBridge } from "@/types/desktop";
import { readSaveFolder, serverSaveFolder, subscribeSaveFolder, writeSaveFolder } from "../utils/folder-storage";

export function useSaveFolder() {
  const folder = useSyncExternalStore(subscribeSaveFolder, readSaveFolder, serverSaveFolder);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setPicking(true);
    setError(null);
    try {
      const desktop: DesktopBridge | undefined = window.desktop;
      if (desktop) {
        const picked = await desktop.pickFolder();
        if (!picked) return;
        const name = picked.split(/[/\\]/).filter(Boolean).pop() || "Desktop";
        writeSaveFolder({ path: picked, name });
        return;
      }
      const response = await fetch("/api/folder", { method: "POST" });
      const data = (await response.json()) as {
        path?: string;
        name?: string;
        cancelled?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Papka tanlanmadi.");
      if (data.cancelled || !data.path || !data.name) return;
      writeSaveFolder({ path: data.path, name: data.name });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Papka tanlanmadi.");
    } finally {
      setPicking(false);
    }
  }

  return { folder, picking, error, pick };
}
