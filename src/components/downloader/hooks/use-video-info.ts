"use client";

import { useEffect, useState } from "react";
import type { VideoInfo } from "@/types/media";
import { clientUrlMessage, mediaKey, readJson } from "../utils/media";

export function useVideoInfo(url: string) {
  const videoKey = mediaKey(url);
  const [loaded, setLoaded] = useState<{ key: string; video: VideoInfo } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [pendingKey, setPendingKey] = useState("");

  useEffect(() => {
    if (!videoKey) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      void loadInfo(url, videoKey, controller, setLoaded, setFailure, setPendingKey);
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [videoKey, url]);

  return {
    videoKey,
    info: loaded?.key === videoKey ? loaded.video : null,
    error: failure?.key === videoKey ? failure.message : clientUrlMessage(url),
    loading: pendingKey === videoKey && videoKey !== "",
  };
}

async function loadInfo(
  url: string,
  videoKey: string,
  controller: AbortController,
  setLoaded: (value: { key: string; video: VideoInfo } | null) => void,
  setFailure: (value: { key: string; message: string } | null) => void,
  setPendingKey: (value: string | ((current: string) => string)) => void,
) {
  setPendingKey(videoKey);
  setFailure(null);
  try {
    const response = await fetch("/api/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
      signal: controller.signal,
    });
    const data = await readJson<VideoInfo & { error?: string }>(response);
    if (!response.ok || !data?.id) throw new Error(data?.error || "Video topilmadi.");
    setLoaded({ key: videoKey, video: data });
  } catch (error) {
    if (controller.signal.aborted) return;
    setLoaded(null);
    setFailure({
      key: videoKey,
      message: error instanceof Error ? error.message : "Video topilmadi.",
    });
  } finally {
    if (!controller.signal.aborted) {
      setPendingKey((current) => (current === videoKey ? "" : current));
    }
  }
}
