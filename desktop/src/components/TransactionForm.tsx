import { useState, useEffect } from "react";
import styles from "@/css/transactionForm.module.css";
import { colors } from "@/Theme/colors";
import { useUser } from "@/context/UserContext";
import { useTransaction, TransactionLineInput, TransactionHeaderInput } from "@/utils/useTransaction";

type FormMode = "create" | "update";

interface TransactionLine {
  id: string;
  description: string;
  relationId?: number;
  amount: number | null;
  vat: "0%" | "9%" | "21%";
  ledgerId?: number;
  type: "ontvangen" | "betalen";
  selectedInvoiceId?: number;
  amountExcl?: number;
  vatAmount?: number;
  amountIncl?: number;
}

interface Ledger {
  id: number;
  number: number;
  name: string;
  type: string;
  category: string;
}

interface Debtor {
  id: number;
  companyName: string;
  companyId: number
}

interface Creditor {
  id: number;
  companyName: string;
  companyId: number
}

interface SalesInvoiceOption {
  id: number;
  invoiceNumber: string;
  debtorId: number;
  title: string;
}

interface PurchaseInvoiceOption {
  id: number;
  invoiceNumber: string;
  creditorId: number;
  title: string;
}

interface TransactionHeaderResponse {
  id: number;
  date: string;
  totalPre: number;
  totalPost: number;
  vatAmount: number;
  TotalIncl: number;
  userId: number;
  companyId: number;
  lines: Array<{
    id: number;
    description: string;
    debtorId: number | null;
    creditorId: number | null;
    amount: number;
    VAT: string;
    vatAmount: number;
    type: "betalen" | "ontvangen";
    ledgerId: number;
    createdById: number;
    salesInvoiceId: number | null;
    purchaseInvoiceId: number | null;
  }>;
}

interface TransactionFormProps {
  onSave?: (lines: TransactionLine[]) => void;
  onClose?: () => void;
  transactionId?: number;
}

export default function TransactionForm({ onSave, onClose, transactionId }: TransactionFormProps) {
  const mode: FormMode = transactionId ? "update" : "create";
  
  const [lines, setLines] = useState<TransactionLine[]>([
    {
      id: "-1",
      description: "",
      relationId: undefined,
      amount: null,
      vat: "21%",
      ledgerId: undefined,
      type: "ontvangen",
      selectedInvoiceId: undefined,
    },
  ]);

  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<string>("");
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(mode === "update");

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoiceOption[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceOption[]>([]);
  const [invoicePickerLineId, setInvoicePickerLineId] = useState<string | null>(null);
  const { user } = useUser();
  const { createTransaction, updateTransaction, loading, error } = useTransaction();

  const getLedgers = async () => {
    try {
        const ledgerList = await window.api?.invoke("ledger:getLedgers", user?.id);
        setLedgers(ledgerList as Ledger[]);
    } catch (error) {
        console.error('Error fetching ledgers:', error);
    }
  }

  const getDebtorsAndCreditors = async () => {
    try {
        const debtorList = await window.api?.invoke("debitor:getDebitors", user?.id);
        const creditorList = await window.api?.invoke("creditor:getCreditors", user?.id);
        setDebtors(debtorList as Debtor[]);
        setCreditors(creditorList as Creditor[]);
    } catch (error) {
        console.error('Error fetching relations:', error);
    }
  }

  const getInvoices = async () => {
    try {
      const sales = await window.api?.invoke("salesInvoice:getInvoices", user?.id);
      const purchases = await window.api?.invoke("purchaseInvoice:getInvoices", user?.id);
      setSalesInvoices((sales ?? []) as SalesInvoiceOption[]);
      setPurchaseInvoices((purchases ?? []) as PurchaseInvoiceOption[]);
    } catch (fetchError) {
      console.error("Error fetching invoices:", fetchError);
    }
  };

  useEffect(() => {
    getLedgers();
    getDebtorsAndCreditors();
    getInvoices();
  }, [user?.id]);

  useEffect(() => {
    if (mode === "update" && transactionId && user?.id) {
      loadTransaction();
    }
  }, [transactionId, user?.id]);

  const loadTransaction = async () => {
    try {
      setIsLoading(true);
      const transactionHeader = await window.api?.invoke("transaction:getTransaction", transactionId) as TransactionHeaderResponse;
      
      if (!transactionHeader) {
        console.error("Transaction not found");
        setIsLoading(false);
        return;
      }

      // Pre-fill date
      setCurrentDate(transactionHeader.date.split('T')[0]);
      setPreviousBalance(null); // Could be loaded from another source if needed
      
      // Convert transaction lines to form format
      const formLines: TransactionLine[] = transactionHeader.lines.map((line: any, index: number) => {
        // Determine VAT format - handle both enum names and mapped values
        let vatFormat: "0%" | "9%" | "21%" = "21%";
        const vatValue = String(line.VAT).trim();
        if (vatValue === "0" || vatValue === "0%" || vatValue === "VAT_0") vatFormat = "0%";
        else if (vatValue === "9" || vatValue === "9%" || vatValue === "VAT_9") vatFormat = "9%";
        else if (vatValue === "21" || vatValue === "21%" || vatValue === "VAT_21") vatFormat = "21%";

        return {
          id: line.id.toString(),
          description: line.description,
          relationId: line.debtorId || line.creditorId || undefined,
          amount: line.amount,
          vat: vatFormat,
          ledgerId: line.ledgerId,
          type: line.type,
          selectedInvoiceId: line.salesInvoiceId || line.purchaseInvoiceId || undefined,
          amountExcl: line.amount,
          vatAmount: line.vatAmount,
          amountIncl: line.amount + line.vatAmount,
        };
      });
      
      setLines(formLines);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading transaction:", error);
      setIsLoading(false);
    }
  };

  const vatPercentages: Record<string, number> = {
    "0%": 0,
    "9%": 0.09,
    "21%": 0.21,
  };

  const calculateTotals = (amount: number | null, vat: string) => {
    const validAmount = amount ?? 0;
    const vatRate = vatPercentages[vat] || 0;
    const amountExcl = validAmount;
    const vatAmount = validAmount * vatRate;
    const amountIncl = validAmount + vatAmount;
    return { amountExcl, vatAmount, amountIncl };
  };

  const handleLineChange = (
    id: string,
    field: keyof TransactionLine,
    value: any
  ) => {
    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value };

          if (field === "ledgerId") {
            const selectedLedger = ledgers.find((ledger) => ledger.id === value);
            
            // Auto-set type and clear invoice based on ledger
            if (selectedLedger?.number === 1300) {
              // Debtor ledger must be "ontvangen"
              updatedLine.type = "ontvangen";
              updatedLine.selectedInvoiceId = undefined;
            } else if (selectedLedger?.number === 1600) {
              // Creditor ledger must be "betalen"
              updatedLine.type = "betalen";
              updatedLine.selectedInvoiceId = undefined;
            }
            
            // For other ledgers, type stays as is
            updatedLine.relationId = undefined;
          }

          // When type changes, clear selectedInvoiceId
          if (field === "type") {
            updatedLine.selectedInvoiceId = undefined;
          }

          // When relationId changes, clear selectedInvoiceId
          if (field === "relationId") {
            updatedLine.selectedInvoiceId = undefined;
          }

          // Recalculate totals if amount or VAT changes
          if (field === "amount" || field === "vat") {
            const amount = field === "amount" ? value : line.amount;
            const vat = field === "vat" ? value : line.vat;
            const totals = calculateTotals(amount, vat);
            return { ...updatedLine, ...totals };
          }
          return updatedLine;
        }
        return line;
      })
    );
  };

  const addLine = () => {
    // Find the most negative ID and go one lower
    const minId = Math.min(...lines.map((l) => parseInt(l.id)), 0);
    const newId = (minId - 1).toString();
    setLines([
      ...lines,
      {
        id: newId,
        description: "",
        relationId: undefined,
        amount: null,
        vat: "21%",
        ledgerId: undefined,
        type: "ontvangen",
        selectedInvoiceId: undefined,
      },
    ]);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter((line) => line.id !== id));
  };

  const getTotals = () => {
    let totalExcl = 0;
    let totalVat = 0;
    let totalIncl = 0;
    let netAmount = 0;

    lines.forEach((line) => {
      const amount = line.amountIncl || 0;
      totalExcl += line.amountExcl || 0;
      totalVat += line.vatAmount || 0;
      totalIncl += amount;
      
      // Add if ontvangen, subtract if betalen
      if (line.type === "ontvangen") {
        netAmount += amount;
      } else if (line.type === "betalen") {
        netAmount -= amount;
      }
    });

    return { totalExcl, totalVat, totalIncl, netAmount };
  };

  const isAccountDisabled = (ledgerId?: number): boolean => {
    if (!ledgerId) return true;
    const selectedLedger = ledgers.find((l) => l.id === ledgerId);
    if (!selectedLedger) return true;
    // Account is only enabled for debtor (1300) or creditor (1600) ledger numbers
    return selectedLedger.number !== 1300 && selectedLedger.number !== 1600;
  };

  const isTypeDisabled = (ledgerId?: number): boolean => {
    if (!ledgerId) return false;
    const selectedLedger = ledgers.find((l) => l.id === ledgerId);
    if (!selectedLedger) return false;
    // Type is locked for debtor (1300) and creditor (1600) ledgers
    return selectedLedger.number === 1300 || selectedLedger.number === 1600;
  };

  const getRelationsForLedger = (ledgerId?: number) => {
    if (!ledgerId) return [];
    const selectedLedger = ledgers.find((l) => l.id === ledgerId);
    if (!selectedLedger) return [];
    
    if (selectedLedger.number === 1300) return debtors;
    if (selectedLedger.number === 1600) return creditors;
    return [];
  };

  const canOpenInvoicePicker = (line: TransactionLine) => {
    return Boolean(line.relationId);
  };

  const getInvoicesForLine = (line: TransactionLine) => {
    if (!line.relationId) return [];

    if (line.type === "ontvangen") {
      return salesInvoices
        .filter((invoice) => invoice.debtorId === line.relationId)
        .map((invoice) => ({ id: invoice.id, label: `${invoice.invoiceNumber} - ${invoice.title}` }));
    }

    return purchaseInvoices
      .filter((invoice) => invoice.creditorId === line.relationId)
      .map((invoice) => ({ id: invoice.id, label: `${invoice.invoiceNumber} - ${invoice.title}` }));
  };

  const totals = getTotals();

  const vatMap: Record<string, string> = {
    "0%": "0%",
    "9%": "9%",
    "21%": "21%",
  };

  const convertToBackendFormat = (): TransactionHeaderInput => {
    // Extract companyId from each line with a debtor/creditor (should all be the same)
    let companyId = 1; // fallback to 1 if no debtor/creditor found
    
    for (const line of lines) {
      if (line.type === "ontvangen" && line.relationId) {
        const debtor = debtors.find((d) => d.id === line.relationId);
        if (debtor) {
          companyId = debtor.companyId;
        }
      } else if (line.type === "betalen" && line.relationId) {
        const creditor = creditors.find((c) => c.id === line.relationId);
        if (creditor) {
          companyId = creditor.companyId;
        }
      }
    }

    const backendLines: TransactionLineInput[] = lines.map((line) => {
      const lineId = parseInt(line.id);
      return {
        ...(lineId > 0 ? { id: lineId } : {}),
        debtorId: line.type === "ontvangen" && line.relationId ? line.relationId : null,
        creditorId: line.type === "betalen" && line.relationId ? line.relationId : null,
        amount: line.amount ?? 0,
        VAT: vatMap[line.vat] as any,
        vatAmount: line.vatAmount ?? 0,
        type: line.type as "betalen" | "ontvangen",
        description: line.description,
        ledgerId: line.ledgerId ?? 0,
        createdById: user?.id ?? 0,
        salesInvoiceId: line.type === "ontvangen" ? (line.selectedInvoiceId ?? null) : null,
        purchaseInvoiceId: line.type === "betalen" ? (line.selectedInvoiceId ?? null) : null,
      };
    });

    return {
      date: currentDate,
      totalPre: totals.totalExcl,
      totalPost: totals.totalExcl,
      vatAmount: totals.totalVat,
      TotalIncl: totals.totalIncl,
      userId: user?.id ?? 0,
      companyId: companyId,
      lines: backendLines,
    };
  };

  const handleSave = async () => {
    try {
      if (!user?.id) {
        console.error("User not found");
        return;
      }

      const transactionData = convertToBackendFormat();
      
      if (mode === "create") {
        await createTransaction(user.id, transactionData);
      } else if (mode === "update" && transactionId) {
        await updateTransaction(transactionId, transactionData);
      }
      
      onSave?.(lines);
      onClose?.();
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
  };

  return (
    <div className={styles.transactionFormContainer}>
      <div className={styles.formHeader}>
        <h2>{mode === "create" ? "Nieuwe Transactie" : "Transactie Bewerken"}</h2>
      </div>

      <div className={styles.headerInfo}>
        <div className={styles.headerField}>
          <label>Datum:</label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className={styles.headerInput}
          />
        </div>
        <div className={styles.headerField}>
          <label>Periode:</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Periode"
            className={styles.headerInput}
          />
        </div>
        <div className={styles.headerField}>
          <label>Vorige saldo:</label>
          <input
            type="number"
            value={previousBalance ?? ""}
            onChange={(e) => setPreviousBalance(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0.00"
            step="0.01"
            className={styles.headerInput}
          />
        </div>
        <div className={styles.headerField}>
          <label>Nieuw saldo:</label>
          <input
            type="number"
            value={((previousBalance ?? 0) + totals.netAmount).toFixed(2)}
            placeholder="0.00"
            
            className={styles.headerInput}
            disabled
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Transactie laden...</p>
          </div>
        ) : (
        <table className={styles.transactionTable}>
          <thead>
            <tr style={{ backgroundColor: colors.primary.main }}>
              <th>Omschrijving</th>
              <th>Grootboek</th>
              <th>Relatie</th>              
              <th>Type</th>              
              <th>Bedrag</th>
              <th>BTW %</th>
              <th>Totaal excl.</th>
              <th>BTW</th>
              <th>Totaal incl.</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className={styles.tableRow}>
                <td>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) =>
                      handleLineChange(line.id, "description", e.target.value)
                    }
                    placeholder="Omschrijving"
                    className={styles.input}
                  />
                </td>
                <td>
                  <select
                    value={line.ledgerId || ""}
                    onChange={(e) =>
                      handleLineChange(line.id, "ledgerId", e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className={styles.select}
                  >
                    <option value="">Selecteer ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.number} - {ledger.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={line.relationId || ""}
                    onChange={(e) =>
                      handleLineChange(line.id, "relationId", e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    className={styles.select}
                    disabled={isAccountDisabled(line.ledgerId)}
                  >
                    <option value="">Selecteer relatie</option>
                    {getRelationsForLedger(line.ledgerId).map((relation) => (
                      <option key={relation.id} value={relation.id}>
                        {relation.companyName}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={line.type}
                    onChange={(e) =>
                      handleLineChange(line.id, "type", e.target.value as "ontvangen" | "betalen")
                    }
                    className={styles.select}
                    disabled={isTypeDisabled(line.ledgerId)}
                  >
                    <option value="ontvangen">Ontvangen</option>
                    <option value="betalen">Betalen</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={line.amount ?? ""}
                    onChange={(e) =>
                      handleLineChange(line.id, "amount", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="0.00"
                    step="0.01"
                    className={styles.input}
                  />
                </td>
                <td>
                  <select
                    value={line.vat}
                    onChange={(e) =>
                      handleLineChange(line.id, "vat", e.target.value)
                    }
                    className={styles.select}
                  >
                    <option value="0%">0%</option>
                    <option value="9%">9%</option>
                    <option value="21%">21%</option>
                  </select>
                </td>
                <td className={styles.readOnly}>
                  €{(line.amountExcl || 0).toFixed(2)}
                </td>
                <td className={styles.readOnly}>
                  €{(line.vatAmount || 0).toFixed(2)}
                </td>
                <td className={styles.readOnly}>
                  €{(line.amountIncl || 0).toFixed(2)}
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.invoiceIconBtn}
                      title={canOpenInvoicePicker(line) ? "Koppel factuur" : "Selecteer eerst een relatie"}
                      disabled={!canOpenInvoicePicker(line)}
                      onClick={() =>
                        setInvoicePickerLineId((prev) => (prev === line.id ? null : line.id))
                      }
                    >
                      📄
                    </button>

                    {invoicePickerLineId === line.id && (
                      <div className={styles.invoicePickerPopover}>
                        <label className={styles.invoicePickerLabel}>Factuur</label>
                        <select
                          value={line.selectedInvoiceId ?? ""}
                          onChange={(e) =>
                            handleLineChange(
                              line.id,
                              "selectedInvoiceId",
                              e.target.value ? parseInt(e.target.value, 10) : undefined
                            )
                          }
                          className={styles.invoicePickerSelect}
                        >
                          <option value="">Geen factuur</option>
                          {getInvoicesForLine(line).map((invoice) => (
                            <option key={invoice.id} value={invoice.id}>
                              {invoice.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => removeLine(line.id)}
                      className={styles.deleteBtn}
                      title="Verwijderen"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      <div className={styles.buttonGroup}>
        <button onClick={addLine} className={styles.addLineBtn}>
          + Regel toevoegen
        </button>
      </div>

      <div className={styles.totalsSection}>
        <div className={styles.totalRow}>
          <span>Totaal excl. BTW:</span>
          <span>€{totals.totalExcl.toFixed(2)}</span>
        </div>
        <div className={styles.totalRow}>
          <span>BTW Totaal:</span>
          <span>€{totals.totalVat.toFixed(2)}</span>
        </div>
        <div className={styles.totalRowHighlight}>
          <span>Totaal incl. BTW:</span>
          <span>€{totals.totalIncl.toFixed(2)}</span>
        </div>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "1rem", padding: "0.5rem" }}>
          Fout: {error}
        </div>
      )}

      <div className={styles.actionButtons}>
        <button onClick={onClose} className={styles.cancelBtn}>
          Annuleren
        </button>
        <button onClick={handleSave} className={styles.saveBtn} disabled={loading || isLoading}>
          {loading || isLoading 
            ? "Bezig met opslaan..." 
            : mode === "create" 
            ? "Opslaan" 
            : "Bijwerken"}
        </button>
      </div>
    </div>
  );
}
