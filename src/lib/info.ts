import { assertMediaUrl } from "@/lib/assert-url";
import { assertBinary, baseFlags, ytdlp } from "@/lib/ytdlp";
import type { VideoInfo } from "@/types/media";

export async function getVideoInfo(input: string): Promise<VideoInfo> {
  assertBinary();
  const link = assertMediaUrl(input);
  const result = await ytdlp(link.url, {
    ...baseFlags(),
    dumpSingleJson: true,
    skipDownload: true,
  });

  if (typeof result === "string") {
    throw new Error("Video haqida ma'lumot olinmadi.");
  }
  if (result.is_live) {
    throw new Error("Jonli efirni yuklab bo'lmaydi.");
  }

  return {
    id: result.id,
    title: result.title,
    channel: result.channel || result.uploader || link.site.label,
    duration: result.duration_string || formatDuration(result.duration),
    thumbnail: result.thumbnail,
    views: typeof result.view_count === "number" ? result.view_count : null,
    source: link.site.label,
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
