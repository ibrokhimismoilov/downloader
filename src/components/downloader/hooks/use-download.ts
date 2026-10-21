"use client";

import { useState } from "react";
import type {} from "@/types/desktop";
import { readSaveFolder } from "@/components/page-header/utils/folder-storage";
import type { DownloadEvent, QualityId } from "@/types/media";
import { readJson } from "../utils/media";

export function useDownload() {
  const [download, setDownload] = useState<DownloadEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(url: string, quality: QualityId) {
    setBusy(true);
    setError(null);
    setDownload({ status: "starting", progress: 0 });

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), quality, dir: readSaveFolder().path }),
      });
      if (!response.ok || !response.body) {
        const data = await readJson<{ error?: string }>(response);
        throw new Error(data?.error || "Yuklab olish boshlanmadi.");
      }
      await readEvents(response.body, setDownload, setError);
    } catch (cause) {
      setDownload(null);
      setError(cause instanceof Error ? cause.message : "Video yuklanmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!download?.filepath) return;
    if (window.desktop) {
      await window.desktop.reveal(download.filepath);
      return;
    }
    const response = await fetch("/api/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filepath: download.filepath }),
    });
    if (!response.ok) {
      const data = await readJson<{ error?: string }>(response);
      setError(data?.error || "Faylni Finderda ochib bo'lmadi.");
    }
  }

  function reset() {
    setDownload(null);
    setError(null);
  }

  return { download, error, busy, start, reveal, reset };
}

async function readEvents(
  body: ReadableStream<Uint8Array>,
  setDownload: (event: DownloadEvent | null) => void,
  setError: (message: string | null) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as DownloadEvent;
      if (event.status === "error") {
        setDownload(null);
        setError(event.error || "Video yuklanmadi.");
      } else {
        setDownload(event);
      }
    }
  }
}
