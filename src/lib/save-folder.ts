import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function desktopDir() {
  return path.join(os.homedir(), "Desktop");
}

export function resolveSaveDir(input?: string | null) {
  if (!input?.trim()) {
    const desktop = desktopDir();
    fs.mkdirSync(desktop, { recursive: true });
    return desktop;
  }

  const dir = path.resolve(input);
  assertInsideUserSpace(dir);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(/*turbopackIgnore: true*/ dir);
  } catch {
    throw new Error("Tanlangan papka topilmadi.");
  }
  if (!stat.isDirectory()) throw new Error("Tanlangan joy papka emas.");
  return dir;
}

export function assertUserFile(filepath: string) {
  const resolved = path.resolve(filepath);
  assertInsideUserSpace(resolved);
  if (!fs.existsSync(/*turbopackIgnore: true*/ resolved) || !fs.statSync(/*turbopackIgnore: true*/ resolved).isFile()) {
    throw new Error("Fayl topilmadi.");
  }
  return resolved;
}

export async function pickSaveDir() {
  if (process.platform === "win32") return pickWindowsDir();
  if (process.platform !== "darwin") {
    throw new Error("Papka tanlash hozircha macOS va Windows da ishlaydi.");
  }

  const prompt = "Video saqlanadigan papkani tanlang";
  const script = [
    "try",
    `POSIX path of (choose folder with prompt "${prompt}" default location (path to desktop folder))`,
    "on error number -128",
    'return ""',
    "end try",
  ].join("\n");

  const { stdout } = await execFileAsync("osascript", ["-e", script], { timeout: 120_000 });
  return finishPick(stdout);
}

async function pickWindowsDir() {
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "$dialog = New-Object System.Windows.Forms.FolderBrowserDialog",
    "$dialog.Description = 'Video saqlanadigan papkani tanlang'",
    "$dialog.SelectedPath = [Environment]::GetFolderPath('Desktop')",
    "if ($dialog.ShowDialog() -eq 'OK') { $dialog.SelectedPath }",
  ].join("; ");
  const { stdout } = await execFileAsync(
    "powershell",
    ["-NoProfile", "-STA", "-Command", script],
    { timeout: 120_000 },
  );
  return finishPick(stdout);
}

function finishPick(stdout: string) {
  const picked = stdout.trim().replace(/[\\/]$/, "");
  if (!picked) return null;
  return resolveSaveDir(picked);
}

function assertInsideUserSpace(target: string) {
  const home = path.resolve(os.homedir());
  const insideHome = target === home || target.startsWith(`${home}${path.sep}`);
  const insideVolume = target.startsWith(`${path.sep}Volumes${path.sep}`);
  const systemRoot = (process.env.SystemRoot || "C:\\Windows").toLowerCase();
  const insideWindowsDrive = process.platform === "win32" && !target.toLowerCase().startsWith(systemRoot);
  if (!insideHome && !insideVolume && !insideWindowsDrive) {
    throw new Error("Papka kompyuteringizdagi shaxsiy joy bo'lishi kerak.");
  }
}
