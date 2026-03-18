type IpcChannel = 
  | "auth:registerUser"
  | "auth:loginUser"
  | "company:createOrUpdate"
  | "company:getCompanyByUser"
  | "debitor:createDebitor"
  | "debitor:getDebitors"
  | "debitor:deleteDebitor"
  | "debitor:updateDebitor";

interface Window {
  api?: {
    invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;
  };
}
