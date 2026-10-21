import { createWriteStream } from "node:fs";
import { chmod, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const dest = path.join(process.cwd(), "bin", "yt-dlp");
const url =
  "https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/yt-dlp_macos";

if (process.platform !== "darwin") {
  console.log("yt-dlp standalone binary is prepared for macOS.");
  process.exit(0);
}

await mkdir(path.dirname(dest), { recursive: true });

let ready = false;
try {
  const info = await stat(dest);
  ready = info.size > 30_000_000;
} catch {
  ready = false;
}

if (!ready) {
  console.log("Downloading yt-dlp…");
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`yt-dlp download failed (${response.status})`);
  }
  await pipeline(response.body, createWriteStream(dest));
}

await chmod(dest, 0o755);
await execFileAsync("xattr", ["-d", "com.apple.quarantine", dest]).catch(() => {});
const { stdout } = await execFileAsync(dest, ["--version"]);
console.log(`yt-dlp ${stdout.trim()} ready`);
