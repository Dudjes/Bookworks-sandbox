type IpcChannel = 
    | "auth:registerUser"
    | "";

interface Window {
  api?: {
    invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;
  };
}
