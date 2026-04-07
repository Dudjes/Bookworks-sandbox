import { useState, useEffect } from "react";
import styles from "@/css/transaction.module.css";
import { colors } from "@/Theme/colors";
import { useUser } from "@/context/UserContext";

interface TransactionLine {
  id: string;
  description: string;
  relationId?: number;
  account: string;
  amount: number | null;
  vat: "0%" | "9%" | "21%";
  ledgerId?: number;
  type: "ontvangen" | "betalen";
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
}

interface Creditor {
  id: number;
  companyName: string;
}

interface TransactionFormProps {
  onSave?: (lines: TransactionLine[]) => void;
  onClose?: () => void;
}

export default function TransactionForm({ onSave, onClose }: TransactionFormProps) {
  const [lines, setLines] = useState<TransactionLine[]>([
    {
      id: "1",
      description: "",
      relationId: undefined,
      account: "",
      amount: null,
      vat: "21%",
      ledgerId: undefined,
      type: "ontvangen",
    },
  ]);

  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<string>("");
  const [previousBalance, setPreviousBalance] = useState<number | null>(null);

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const { user } = useUser();

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

  useEffect(() => {
    getLedgers();
    getDebtorsAndCreditors();
  }, [user?.id]);

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
    const newId = Math.max(...lines.map((l) => parseInt(l.id)), 0) + 1;
    setLines([
      ...lines,
      {
        id: newId.toString(),
        description: "",
        relationId: undefined,
        account: "",
        amount: null,
        vat: "21%",
        ledgerId: undefined,
        type: "ontvangen",
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

  const getRelationsForLedger = (ledgerId?: number) => {
    if (!ledgerId) return [];
    const selectedLedger = ledgers.find((l) => l.id === ledgerId);
    if (!selectedLedger) return [];
    
    if (selectedLedger.number === 1300) return debtors;
    if (selectedLedger.number === 1600) return creditors;
    return [];
  };

  const totals = getTotals();

  const handleSave = () => {
    onSave?.(lines);
  };

  return (
    <div className={styles.transactionFormContainer}>
      <div className={styles.formHeader}>
        <h2>Nieuwe Transactie</h2>
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
                  <button
                    onClick={() => removeLine(line.id)}
                    className={styles.deleteBtn}
                    title="Verwijderen"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <div className={styles.actionButtons}>
        <button onClick={onClose} className={styles.cancelBtn}>
          Annuleren
        </button>
        <button onClick={handleSave} className={styles.saveBtn}>
          Opslaan
        </button>
      </div>
    </div>
  );
}
