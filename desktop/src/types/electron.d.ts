type IpcChannel = 
  | "auth:registerUser"
  | "auth:loginUser"
  | "company:createOrUpdate"
  | "company:getCompanyByUser"
  | "debitor:createDebitor"
  | "debitor:getDebitors"
  | "debitor:deleteDebitor"
  | "debitor:updateDebitor"
  | "creditor:createCreditor"
  | "creditor:getCreditors"
  | "creditor:deleteCreditor"
  | "creditor:updateCreditor"
  | "salesInvoice:generateNumber"
  | "salesInvoice:createInvoice"
  | "salesInvoice:getInvoices"
  | "salesInvoice:updateInvoice"
  | "salesInvoice:deleteInvoice"
  | "salesInvoice:getInvoice"
  | "purchaseInvoice:generateNumber"
  | "purchaseInvoice:createInvoice"
  | "purchaseInvoice:getInvoices"
  | "purchaseInvoice:updateInvoice"
  | "purchaseInvoice:deleteInvoice"
  | "purchaseInvoice:getInvoice"
  | "ledger:getLedgers"
  | "ledger:createLedger"
  | "ledger:deleteLedger"
  | "ledger:updateLedger";

interface Window {
  api?: {
    invoke: (channel: IpcChannel, ...args: unknown[]) => Promise<unknown>;
  };
}
