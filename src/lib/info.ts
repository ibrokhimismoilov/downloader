import { assertMediaUrl } from "@/lib/assert-url";
import { assertBinary, baseFlags, ytdlp } from "@/lib/ytdlp";
import type { VideoInfo } from "@/types/media";

export async function getVideoInfo(input: string, signal?: AbortSignal): Promise<VideoInfo> {
  assertBinary();
  const link = assertMediaUrl(input);
  const child = ytdlp.exec(link.url, {
    ...baseFlags(),
    dumpSingleJson: true,
    skipDownload: true,
  });
  const stop = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  if (signal?.aborted) stop();
  else signal?.addEventListener("abort", stop, { once: true });

  let result: { stdout?: string; is_live?: boolean };
  try {
    result = await child;
  } catch (error) {
    if (signal?.aborted) throw new Error("Qidiruv to'xtatildi.");
    throw error;
  } finally {
    signal?.removeEventListener("abort", stop);
  }

  const parsed = parseInfo(result.stdout);
  if (!parsed) throw new Error("Video haqida ma'lumot olinmadi.");
  if (parsed.is_live) {
    throw new Error("Jonli efirni yuklab bo'lmaydi.");
  }

  return {
    id: parsed.id,
    title: parsed.title,
    channel: parsed.channel || parsed.uploader || link.site.label,
    duration: parsed.duration_string || formatDuration(parsed.duration),
    thumbnail: parsed.thumbnail,
    views: typeof parsed.view_count === "number" ? parsed.view_count : null,
    source: link.site.label,
  };
}

function parseInfo(stdout: string | undefined) {
  if (!stdout || !stdout.trim().startsWith("{")) return null;
  return JSON.parse(stdout) as {
    id: string;
    title: string;
    channel?: string;
    uploader?: string;
    duration_string?: string;
    duration?: number | null;
    thumbnail: string;
    view_count?: number | null;
    is_live?: boolean;
  };
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds < 0) return "";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${secs}` : `${minutes}:${secs}`;
}
