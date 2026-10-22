import path from "node:path";
import type { DownloadEvent } from "@/types/media";

type State = {
  buffer: string;
  filepath: string;
  progress: number;
  speed?: string;
  eta?: string;
  downloaded?: string;
  total?: string;
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
    snapshot: () => toEvent(state),
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
    const got = labeledSize(line, "got");
    const exact = labeledSize(line, "of");
    const estimate = labeledSize(line, "est");
    if (speed && !/unknown|^NA\//i.test(speed[1])) state.speed = speed[1];
    if (eta && !/unknown|^NA$/i.test(eta[1])) state.eta = eta[1];
    if (got && !got.startsWith("~")) state.downloaded = got;
    if (exact && !exact.startsWith("~")) state.total = exact;
    else if (estimate) state.total = estimate.startsWith("~") ? estimate : `~${estimate}`;
    else if (exact) state.total = exact;
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
  onProgress(toEvent(state));
}

function toEvent(state: State): DownloadEvent {
  return {
    status: state.status,
    progress: state.progress,
    speed: state.speed,
    eta: state.eta,
    downloaded: state.downloaded,
    total: state.total,
    filepath: state.filepath || undefined,
    filename: state.filepath ? path.basename(state.filepath) : undefined,
  };
}

function labeledSize(line: string, label: string) {
  const match = line.match(new RegExp(String.raw`\b${label}\s+(?:~\s*)?([\d.]+)\s*([KMGT]?i?B)`, "i"));
  if (!match) return;
  const approx = new RegExp(String.raw`\b${label}\s+~`, "i").test(line);
  return `${approx ? "~" : ""}${match[1]}${match[2]}`;
}
