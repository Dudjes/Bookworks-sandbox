import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
});
