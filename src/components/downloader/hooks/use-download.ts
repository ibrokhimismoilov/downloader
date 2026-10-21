"use client";

import { useRef, useState } from "react";
import type {} from "@/types/desktop";
import { readSaveFolder } from "@/components/page-header/utils/folder-storage";
import type { DownloadEvent, QualityId } from "@/types/media";
import { readJson } from "../utils/media";

export function useDownload() {
  const [download, setDownload] = useState<DownloadEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const runRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  async function start(url: string, quality: QualityId, subtitles: boolean) {
    const run = ++runRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setDownload({ status: "starting", progress: 0 });

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          quality,
          dir: readSaveFolder().path,
          subtitles,
        }),
        signal: controller.signal,
      });
      if (runRef.current !== run) return;
      if (!response.ok || !response.body) {
        const data = await readJson<{ error?: string }>(response);
        throw new Error(data?.error || "Yuklab olish boshlanmadi.");
      }
      await readEvents(response.body, run, runRef, setDownload, setError);
    } catch (cause) {
      if (runRef.current !== run || controller.signal.aborted) return;
      setDownload(null);
      setError(cause instanceof Error ? cause.message : "Video yuklanmadi.");
    } finally {
      if (runRef.current === run) setBusy(false);
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
    runRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setDownload(null);
    setError(null);
    setBusy(false);
  }

  return { download, error, busy, start, reveal, reset };
}

async function readEvents(
  body: ReadableStream<Uint8Array>,
  run: number,
  runRef: { current: number },
  setDownload: (event: DownloadEvent | null) => void,
  setError: (message: string | null) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (runRef.current === run) {
    const { value, done } = await reader.read();
    if (done || runRef.current !== run) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim() || runRef.current !== run) continue;
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
