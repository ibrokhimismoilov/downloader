import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import youtubeDl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";

const require = createRequire(import.meta.url);

function ytdlpBinary() {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const name = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(process.cwd(), "bin", name);
}

const binaryPath = ytdlpBinary();

export const ytdlp = youtubeDl.create(binaryPath);

export function assertBinary() {
  if (!fs.existsSync(/*turbopackIgnore: true*/ binaryPath)) {
    throw new Error("yt-dlp topilmadi. Terminalda `npm install` ni qayta ishga tushiring.");
  }
}

export function baseFlags(): Flags {
  return {
    noPlaylist: true,
    noWarnings: true,
    noCheckCertificates: true,
    newline: true,
    noUpdate: true,
    jsRuntimes: `node:${process.env.YTDLP_JS_RUNTIME || process.execPath}`,
    ffmpegLocation: ffmpegDir(),
    remoteComponents: "ejs:github",
  };
}

function ffmpegDir() {
  if (process.env.FFMPEG_DIR && fs.existsSync(/*turbopackIgnore: true*/ process.env.FFMPEG_DIR)) {
    return process.env.FFMPEG_DIR;
  }

  const ffmpegPath = ffmpegPackage();
  const ffprobe = ffprobePackage();
  if (!ffmpegPath || !fs.existsSync(/*turbopackIgnore: true*/ ffmpegPath)) {
    throw new Error("ffmpeg topilmadi. `npm install` ni qayta ishga tushiring.");
  }
  if (!ffprobe?.path || !fs.existsSync(/*turbopackIgnore: true*/ ffprobe.path)) {
    throw new Error("ffprobe topilmadi. `npm install` ni qayta ishga tushiring.");
  }

  const dir = path.join(process.cwd(), ".tools");
  fs.mkdirSync(dir, { recursive: true });
  linkTool(ffmpegPath, path.join(dir, "ffmpeg"));
  linkTool(ffprobe.path, path.join(dir, "ffprobe"));
  return dir;
}

function ffmpegPackage() {
  try {
    return require("ffmpeg-static") as string;
  } catch {
    return null;
  }
}

function ffprobePackage() {
  try {
    return require("ffprobe-static") as { path: string };
  } catch {
    return null;
  }
}

function linkTool(source: string, dest: string) {
  fs.chmodSync(source, 0o755);
  try {
    if (fs.readlinkSync(dest) === source) return;
  } catch {
    // A regular file is replaced below.
  }
  if (fs.existsSync(/*turbopackIgnore: true*/ dest)) fs.unlinkSync(dest);
  try {
    fs.symlinkSync(source, dest);
  } catch {
    fs.copyFileSync(source, dest);
  }
}
