import fs from "node:fs";
import path from "node:path";
import type { Flags } from "youtube-dl-exec";
import { assertMediaUrl } from "@/lib/assert-url";
import { cleanYtError } from "@/lib/errors";
import { formats } from "@/lib/formats";
import { createProgress } from "@/lib/progress";
import { resolveSaveDir } from "@/lib/save-folder";
import { assertBinary, baseFlags, ytdlp } from "@/lib/ytdlp";
import type { DownloadEvent, QualityId } from "@/types/media";

export async function downloadVideo(
  input: string,
  quality: QualityId,
  dir: string,
  onProgress: (event: DownloadEvent) => void,
  signal?: AbortSignal,
) {
  assertBinary();
  const url = assertMediaUrl(input).url;
  const outputDir = resolveSaveDir(dir);
  fs.mkdirSync(outputDir, { recursive: true });

  onProgress({ status: "starting", progress: 0 });
  const child = ytdlp.exec(url, downloadFlags(quality, outputDir));
  const progress = createProgress();
  const onData = (chunk: Buffer | string) => progress.consume(chunk, onProgress);
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);

  const abort = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });

  try {
    await child;
  } catch (error) {
    if (signal?.aborted) throw new Error("Yuklab olish bekor qilindi.");
    throw new Error(cleanYtError(errorText(error)));
  } finally {
    signal?.removeEventListener("abort", abort);
  }

  const filepath = progress.filepath();
  if (!filepath || !fs.existsSync(/*turbopackIgnore: true*/ filepath)) {
    throw new Error("Video yuklandi, lekin fayl topilmadi.");
  }

  onProgress({
    status: "done",
    progress: 100,
    filepath,
    filename: path.basename(filepath),
  });
}

function downloadFlags(quality: QualityId, outputDir: string): Flags {
  const preset = formats[quality];
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

  if ("mergeOutputFormat" in preset) flags.mergeOutputFormat = preset.mergeOutputFormat;
  if ("extractAudio" in preset) {
    flags.extractAudio = true;
    flags.audioFormat = preset.audioFormat;
    flags.audioQuality = preset.audioQuality;
  }
  return flags;
}

function errorText(error: unknown) {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? "");
    if (stderr.trim()) return stderr;
  }
  return error instanceof Error ? error.message : "";
}
