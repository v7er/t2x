const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("t2xNative", {
  desktop: true,
  platform: "darwin",
});
