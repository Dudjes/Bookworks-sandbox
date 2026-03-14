import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { ensureDatabaseSchema } from "./database.js";
import * as auth from "./database/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";
if (isDev) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
}

let mainWindow: BrowserWindow | null = null;

const resolvePreloadPath = () => {
  const candidates = ["preload.cjs", "preload.js", "preload.mjs"];

  for (const fileName of candidates) {
    const fullPath = path.join(__dirname, fileName);
    if (existsSync(fullPath)) return fullPath;
  }

  throw new Error("Preload file not found in dist-electron output.");
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 1200,
    minHeight: 800,
    width: 1200,
    height: 800,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, "../dist/index.html")}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

type IpcHandler = (...args: any[]) => unknown;
const handlers: Record<string, IpcHandler> = {
  "auth:registerUser": auth.registerUser,
};

for (const [channel, handler] of Object.entries(handlers)) {
  ipcMain.handle(channel, (_event, ...args) => handler(...args));
}

app
  .whenReady()
  .then(async () => {
    await ensureDatabaseSchema();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((err) => {
    console.error("Failed to start Electron app:", err);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
