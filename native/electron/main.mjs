import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

app.setName("T2x");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 420,
    minHeight: 700,
    backgroundColor: "#070908",
    title: "T2x",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(dir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  void win.loadFile(path.join(dir, "dist", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
