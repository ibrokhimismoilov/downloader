import { createRequire } from "node:module";
import { createWriteStream } from "node:fs";
import { chmod, cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const root = process.cwd();
const out = path.join(root, "desktop-resources");
const wantWin = process.argv.includes("--win");

await rm(out, { recursive: true, force: true });
await run("npx", ["next", "build"]);

const standalone = path.join(root, ".next", "standalone");
await cp(standalone, path.join(out, "standalone"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(out, "standalone", ".next", "static"), {
  recursive: true,
});
await cp(path.join(root, "public"), path.join(out, "standalone", "public"), { recursive: true }).catch(
  () => {},
);

const hostBin = process.platform === "win32" ? "bin-win" : "bin-mac";
await copyHostTools(path.join(out, hostBin));
if (wantWin && hostBin !== "bin-win") await copyWindowsTools(path.join(out, "bin-win"));
console.log("Desktop resources ready");

async function copyHostTools(dir) {
  await mkdir(dir, { recursive: true });
  const ytdlp = path.join(root, "bin", process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
  const ffmpeg = require("ffmpeg-static");
  const ffprobe = require("ffprobe-static").path;
  await cp(ytdlp, path.join(dir, path.basename(ytdlp)));
  await cp(ffmpeg, path.join(dir, path.basename(ffmpeg)));
  await cp(ffprobe, path.join(dir, path.basename(ffprobe)));
  if (process.platform !== "win32") {
    await chmod(path.join(dir, path.basename(ytdlp)), 0o755);
    await chmod(path.join(dir, path.basename(ffmpeg)), 0o755);
    await chmod(path.join(dir, path.basename(ffprobe)), 0o755);
  }
}

async function copyWindowsTools(dir) {
  await mkdir(dir, { recursive: true });
  await download(
    "https://github.com/yt-dlp/yt-dlp/releases/download/2026.08.19/yt-dlp.exe",
    path.join(dir, "yt-dlp.exe"),
  );
  await downloadGz(
    "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64.gz",
    path.join(dir, "ffmpeg.exe"),
  );
  await cp(path.join(root, "node_modules", "ffprobe-static", "bin", "win32", "x64", "ffprobe.exe"), path.join(dir, "ffprobe.exe"));
}

async function download(url, dest) {
  const info = await stat(dest).catch(() => null);
  if (info && info.size > 1_000_000) return;
  console.log(`Downloading ${path.basename(dest)}…`);
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Download failed (${response.status}) ${url}`);
  await pipeline(response.body, createWriteStream(dest));
}

async function downloadGz(url, dest) {
  console.log(`Downloading ${path.basename(dest)}…`);
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Download failed (${response.status}) ${url}`);
  await pipeline(response.body, createGunzip(), createWriteStream(dest));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", cwd: root, shell: process.platform === "win32" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))));
  });
}
