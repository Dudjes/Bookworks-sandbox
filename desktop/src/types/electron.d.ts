type IpcChannel = 
  | "auth:registerUser"
  | "auth:loginUser"
  | "company:createOrUpdate"
  | "company:getCompanyByUser"
  | "debitor:createDebitor"
  | "debitor:getDebitors"
  | "debitor:deleteDebitor"
  | "debitor:updateDebitor"
  | "invoice:createInvoice"
  | "invoice:generateNumber"
  | "invoice:getInvoices"
  | "invoice:updateInvoice"
  | "invoice:deleteInvoice"
  | "invoice:getInvoice";

interface Window {
  api?: {
    invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;
  };
}
