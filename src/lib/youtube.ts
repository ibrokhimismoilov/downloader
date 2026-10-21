import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import youtubeDl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";
import { inspectMediaUrl, unsupportedSiteMessage } from "@/lib/sites";

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static") as string | null;
const ffprobe = require("ffprobe-static") as { path: string };

export const qualities = {
  best: {
    label: "Eng yaxshi",
    format: "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  "1080": {
    label: "1080p",
    format:
      "bv*[height<=1080][ext=mp4]+ba[ext=m4a]/b[height<=1080][ext=mp4]/bv*[height<=1080]+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  "720": {
    label: "720p",
    format:
      "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b",
    mergeOutputFormat: "mp4" as const,
  },
  audio: {
    label: "MP3",
    format: "ba[ext=m4a]/ba/b",
    extractAudio: true,
    audioFormat: "mp3",
    audioQuality: "0",
  },
} as const;

export type QualityId = keyof typeof qualities;

export type VideoInfo = {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  views: number | null;
  source: string;
};

export type DownloadEvent = {
  status: "starting" | "downloading" | "merging" | "done" | "error";
  progress: number;
  speed?: string;
  eta?: string;
  filepath?: string;
  filename?: string;
  error?: string;
};

const binaryPath = path.join(process.cwd(), "bin", "yt-dlp");
const ytdlp = youtubeDl.create(binaryPath);

export function downloadsDir() {
  return path.join(os.homedir(), "Downloads");
}

export function assertMediaUrl(input: string) {
  const inspected = inspectMediaUrl(input);
  if (inspected.ok) return inspected.link;

  if (inspected.reason === "protocol") {
    throw new Error("Faqat http yoki https havola qabul qilinadi.");
  }
  if (inspected.reason === "unsupported") {
    throw new Error(unsupportedSiteMessage());
  }
  if (inspected.reason === "incomplete") {
    throw new Error("Video havolasini to'liq qo'ying.");
  }
  throw new Error("Havola noto'g'ri. To'liq video manzilini qo'ying.");
}

export function isQuality(value: unknown): value is QualityId {
  return typeof value === "string" && value in qualities;
}

function assertBinary() {
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      "yt-dlp topilmadi. Terminalda `npm install` ni qayta ishga tushiring.",
    );
  }
}

function ffmpegDir() {
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    throw new Error("ffmpeg topilmadi. `npm install` ni qayta ishga tushiring.");
  }
  if (!ffprobe.path || !fs.existsSync(ffprobe.path)) {
    throw new Error("ffprobe topilmadi. `npm install` ni qayta ishga tushiring.");
  }

  const dir = path.join(process.cwd(), ".tools");
  fs.mkdirSync(dir, { recursive: true });
  linkTool(ffmpegPath, path.join(dir, "ffmpeg"));
  linkTool(ffprobe.path, path.join(dir, "ffprobe"));
  return dir;
}

function linkTool(source: string, dest: string) {
  fs.chmodSync(source, 0o755);
  try {
    if (fs.readlinkSync(dest) === source) return;
    fs.unlinkSync(dest);
  } catch {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
  }
  fs.symlinkSync(source, dest);
}

function baseFlags(): Flags {
  return {
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    newline: true,
    noUpdate: true,
    jsRuntimes: `node:${process.execPath}`,
    ffmpegLocation: ffmpegDir(),
    remoteComponents: "ejs:github",
  };
}

export function cleanYtError(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const errorLine = [...lines].reverse().find((line) => line.startsWith("ERROR:"));
  const message = (errorLine ?? lines.at(-1) ?? "Video yuklanmadi.").replace(
    /^ERROR:\s*/,
    "",
  );

  if (/unsupported version of python/i.test(message)) {
    return "yt-dlp ishga tushmadi. `npm install` ni qayta ishga tushiring.";
  }
  if (/connection reset|timed out|network is unreachable|unable to download/i.test(message)) {
    return "Sayt bilan aloqa uzildi. Internetda bu sayt ochilishini tekshiring va qayta urinib ko'ring.";
  }
  if (/login required|cookies|sign in|private video|video unavailable|not available/i.test(message)) {
    return "Bu video yopiq yoki hisob talab qiladi. Ommaviy havolani qo'ying.";
  }
  if (/live event|is live/i.test(message)) {
    return "Jonli efirni yuklab bo'lmaydi.";
  }

  return message;
}

export async function getVideoInfo(input: string): Promise<VideoInfo> {
  assertBinary();
  const link = assertMediaUrl(input);
  const url = link.url;
  const result = await ytdlp(url, {
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
  const secs = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
}

export async function downloadVideo(
  input: string,
  quality: QualityId,
  onProgress: (event: DownloadEvent) => void,
  signal?: AbortSignal,
) {
  assertBinary();
  const url = assertMediaUrl(input).url;
  const preset = qualities[quality];
  const outputDir = downloadsDir();
  fs.mkdirSync(outputDir, { recursive: true });

  const flags: Flags = {
    ...baseFlags(),
    format: preset.format,
    output: "%(title).100B [%(id)s].%(ext)s",
    paths: outputDir,
    restrictFilenames: false,
    trimFilenames: 100,
    forceOverwrites: true,
    noMtime: true,
    progress: true,
    print: "after_move:filepath",
  };

  if ("mergeOutputFormat" in preset) {
    flags.mergeOutputFormat = preset.mergeOutputFormat;
  }
  if ("extractAudio" in preset) {
    flags.extractAudio = true;
    flags.audioFormat = preset.audioFormat;
    flags.audioQuality = preset.audioQuality;
  }

  onProgress({ status: "starting", progress: 0 });

  const child = ytdlp.exec(url, flags);
  let buffer = "";
  let filepath = "";
  let progress = 0;
  let speed: string | undefined;
  let eta: string | undefined;
  let status: DownloadEvent["status"] = "starting";
  let lastEmit = 0;

  const emit = (force = false) => {
    const now = Date.now();
    if (!force && now - lastEmit < 200) return;
    lastEmit = now;
    onProgress({
      status,
      progress,
      speed,
      eta,
      filepath: filepath || undefined,
      filename: filepath ? path.basename(filepath) : undefined,
    });
  };

  const consume = (chunk: Buffer | string) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r\n|\n|\r/);
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const percent = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
      if (percent) {
        status = "downloading";
        progress = Math.max(progress, Math.min(99, Number(percent[1])));
        const speedMatch = line.match(/at\s+(\S+\/s)/);
        const etaMatch = line.match(/ETA\s+(\S+)/);
        if (speedMatch && !/unknown/i.test(speedMatch[1])) speed = speedMatch[1];
        if (etaMatch && !/unknown/i.test(etaMatch[1])) eta = etaMatch[1];
        emit();
      }

      if (/\[(Merger|ExtractAudio|VideoRemuxer)\]/.test(line)) {
        status = "merging";
        progress = Math.max(progress, 99);
        const merged = line.match(/"([^"]+)"/);
        if (merged) filepath = merged[1];
        emit(true);
      }

      if (path.isAbsolute(line) && /\.(mp4|mkv|webm|m4a|mp3)$/i.test(line)) {
        filepath = line;
      }
    }
  };

  child.stdout?.on("data", consume);
  child.stderr?.on("data", consume);

  const abort = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  try {
    await child;
  } catch (error) {
    if (signal?.aborted) {
      throw new Error("Yuklab olish bekor qilindi.");
    }
    const stderr =
      error && typeof error === "object" && "stderr" in error
        ? String((error as { stderr?: unknown }).stderr ?? "")
        : "";
    throw new Error(cleanYtError(stderr || (error instanceof Error ? error.message : "")));
  } finally {
    signal?.removeEventListener("abort", abort);
  }

  if (!filepath || !fs.existsSync(filepath)) {
    throw new Error("Video yuklandi, lekin fayl topilmadi.");
  }

  onProgress({
    status: "done",
    progress: 100,
    filepath,
    filename: path.basename(filepath),
  });
}

export function revealInFinder(filepath: string) {
  const root = downloadsDir();
  const resolved = path.resolve(filepath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Faqat Downloads papkasidagi fayl ochiladi.");
  }
  if (!fs.existsSync(resolved)) {
    throw new Error("Fayl topilmadi.");
  }

  const opener = spawn("open", ["-R", resolved], { detached: true, stdio: "ignore" });
  opener.unref();
}
