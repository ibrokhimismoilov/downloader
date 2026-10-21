import path from "node:path";
import type { DownloadEvent } from "@/types/media";

type State = {
  buffer: string;
  filepath: string;
  progress: number;
  speed?: string;
  eta?: string;
  status: DownloadEvent["status"];
  lastEmit: number;
};

export function createProgress() {
  const state: State = {
    buffer: "",
    filepath: "",
    progress: 0,
    status: "starting",
    lastEmit: 0,
  };

  return {
    consume(chunk: Buffer | string, onProgress: (event: DownloadEvent) => void) {
      state.buffer += chunk.toString();
      const lines = state.buffer.split(/\r\n|\n|\r/);
      state.buffer = lines.pop() ?? "";
      for (const line of lines) applyLine(state, line.trim(), onProgress);
    },
    filepath: () => state.filepath,
  };
}

function applyLine(
  state: State,
  line: string,
  onProgress: (event: DownloadEvent) => void,
) {
  if (!line) return;

  const percent = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
  if (percent) {
    state.status = "downloading";
    state.progress = Math.max(state.progress, Math.min(99, Number(percent[1])));
    const speed = line.match(/at\s+(\S+\/s)/);
    const eta = line.match(/ETA\s+(\S+)/);
    if (speed && !/unknown/i.test(speed[1])) state.speed = speed[1];
    if (eta && !/unknown/i.test(eta[1])) state.eta = eta[1];
    emit(state, onProgress, false);
  }

  if (/\[(Merger|ExtractAudio|VideoRemuxer)\]/.test(line)) {
    state.status = "merging";
    state.progress = Math.max(state.progress, 99);
    const merged = line.match(/"([^"]+)"/);
    if (merged) state.filepath = merged[1];
    emit(state, onProgress, true);
  }

  if (path.isAbsolute(line) && /\.(mp4|mkv|webm|m4a|mp3)$/i.test(line)) {
    state.filepath = line;
  }
}

function emit(
  state: State,
  onProgress: (event: DownloadEvent) => void,
  force: boolean,
) {
  const now = Date.now();
  if (!force && now - state.lastEmit < 200) return;
  state.lastEmit = now;
  onProgress({
    status: state.status,
    progress: state.progress,
    speed: state.speed,
    eta: state.eta,
    filepath: state.filepath || undefined,
    filename: state.filepath ? path.basename(state.filepath) : undefined,
  });
}
