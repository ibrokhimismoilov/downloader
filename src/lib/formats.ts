import type { Flags } from "youtube-dl-exec";
import type { QualityId } from "@/types/media";

export const formats = {
  best: {
    format: "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  "1080": {
    format:
      "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/bv*[height<=1080]+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  "720": {
    format:
      "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  audio: {
    format: "ba[ext=m4a]/ba/b",
    extractAudio: true,
    audioFormat: "mp3",
    audioQuality: "0",
  },
} as const;

export function isQuality(value: unknown): value is QualityId {
  return typeof value === "string" && value in formats;
}

export function subtitleFlags(enabled: boolean): Partial<Flags> {
  if (!enabled) return {};
  return {
    writeSubs: true,
    writeAutoSubs: true,
    subLangs: "all,-live_chat",
    convertSubs: "srt",
  };
}
