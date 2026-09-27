#!/usr/bin/env node
import { mkdirSync, rmSync, existsSync, cpSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "native/electron");
const RELEASE = join(ROOT, "native/release");
const ICON_ICNS = join(APP_DIR, "icon.icns");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed`);
  }
}

function zipApp(appPath, zipPath) {
  run("python3", [join(ROOT, "scripts/zip-app.py"), appPath, zipPath]);
}

mkdirSync(RELEASE, { recursive: true });

console.log("[native] building web shell");
run("npx", ["vite", "build", "--config", "vite.native.config.ts"]);

if (!existsSync(ICON_ICNS)) {
  throw new Error("native/electron/icon.icns is missing");
}

console.log("[native] packaging macOS app");
run("npx", [
  "--yes",
  "@electron/packager",
  APP_DIR,
  "T2x",
  "--platform=darwin",
  "--arch=arm64",
  "--electron-version=33.4.11",
  `--out=${RELEASE}`,
  "--overwrite",
  "--app-bundle-id=app.t2x.desktop",
  "--app-category-type=public.app-category.productivity",
  "--darwin-dark-mode-support",
  "--prune=false",
  `--icon=${ICON_ICNS}`,
]);

const appPath = join(RELEASE, "T2x-darwin-arm64", "T2x.app");
if (!existsSync(appPath)) throw new Error("T2x.app was not created");
cpSync(ICON_ICNS, join(appPath, "Contents/Resources/electron.icns"));

const zipPath = join(ROOT, "T2x-macOS.zip");
rmSync(zipPath, { force: true });
zipApp(appPath, zipPath);
cpSync(zipPath, join(RELEASE, "T2x-macOS.zip"));
console.log("[native] done", zipPath);
