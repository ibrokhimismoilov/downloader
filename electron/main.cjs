const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const port = "47321";
let server;

function resource(...parts) {
  if (app.isPackaged) return path.join(process.resourcesPath, ...parts);
  const bin = process.platform === "win32" ? "bin-win" : "bin-mac";
  const mapped = parts[0] === "bin" ? [bin, ...parts.slice(1)] : parts;
  return path.join(__dirname, "..", "desktop-resources", ...mapped);
}

function nodeShim() {
  const dir = app.getPath("userData");
  fs.mkdirSync(dir, { recursive: true });
  if (process.platform === "win32") {
    const file = path.join(dir, "node.cmd");
    fs.writeFileSync(file, `@echo off\r\nset ELECTRON_RUN_AS_NODE=1\r\n"${process.execPath}" %*\r\n`);
    return file;
  }
  const file = path.join(dir, "node-shim");
  fs.writeFileSync(file, `#!/bin/sh\nexport ELECTRON_RUN_AS_NODE=1\nexec "${process.execPath}" "$@"\n`);
  fs.chmodSync(file, 0o755);
  return file;
}

function startServer() {
  const standalone = resource("standalone");
  const binary = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  server = spawn(process.execPath, [path.join(standalone, "server.js")], {
    cwd: standalone,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      PORT: port,
      HOSTNAME: "127.0.0.1",
      YTDLP_PATH: resource("bin", binary),
      FFMPEG_DIR: resource("bin"),
      YTDLP_JS_RUNTIME: nodeShim(),
    },
  });
  server.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr?.on("data", (chunk) => process.stderr.write(chunk));
}

function waitForServer() {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(`http://127.0.0.1:${port}`, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() - started > 30_000) reject(new Error("Ilova serveri ochilmadi."));
        else setTimeout(tick, 200);
      });
    };
    tick();
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 420,
    minHeight: 640,
    title: "Yuklab olish",
    backgroundColor: "#14110f",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.loadURL(`http://127.0.0.1:${port}`);
}

ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Video saqlanadigan papkani tanlang",
    defaultPath: app.getPath("desktop"),
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle("reveal", (_event, filepath) => {
  if (typeof filepath === "string" && filepath) shell.showItemInFolder(filepath);
});

app.whenReady().then(async () => {
  startServer();
  await waitForServer();
  createWindow();
});

app.on("window-all-closed", () => {
  server?.kill();
  app.quit();
});
