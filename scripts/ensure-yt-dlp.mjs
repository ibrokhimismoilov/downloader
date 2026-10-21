import { createWriteStream } from "node:fs";
import { chmod, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const release = "2026.08.19";
const builds = {
  darwin: { file: "yt-dlp", url: `https://github.com/yt-dlp/yt-dlp/releases/download/${release}/yt-dlp_macos` },
  win32: { file: "yt-dlp.exe", url: `https://github.com/yt-dlp/yt-dlp/releases/download/${release}/yt-dlp.exe` },
  linux: { file: "yt-dlp", url: `https://github.com/yt-dlp/yt-dlp/releases/download/${release}/yt-dlp_linux` },
};

const build = builds[process.platform];
if (!build) {
  console.log("yt-dlp standalone binary is prepared for macOS, Windows, and Linux.");
  process.exit(0);
}

const dest = path.join(process.cwd(), "bin", build.file);
await mkdir(path.dirname(dest), { recursive: true });

let ready = false;
try {
  const info = await stat(dest);
  ready = info.size > 10_000_000;
} catch {
  ready = false;
}

if (!ready) {
  console.log("Downloading yt-dlp…");
  const response = await fetch(build.url);
  if (!response.ok || !response.body) {
    throw new Error(`yt-dlp download failed (${response.status})`);
  }
  await pipeline(response.body, createWriteStream(dest));
}

if (process.platform !== "win32") await chmod(dest, 0o755);
if (process.platform === "darwin") {
  await execFileAsync("xattr", ["-d", "com.apple.quarantine", dest]).catch(() => {});
}
const { stdout } = await execFileAsync(dest, ["--version"]);
console.log(`yt-dlp ${stdout.trim()} ready`);
