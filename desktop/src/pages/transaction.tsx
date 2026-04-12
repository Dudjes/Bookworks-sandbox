import BaseHeader from "@/components/baseHeader";
import Modal from "@/components/Modal";
import TransactionForm from "@/components/TransactionForm";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useTransaction } from "@/utils/useTransaction";
import styles from "@/css/transaction.module.css"
import { PDFViewer } from "@react-pdf/renderer";
import { InvoicePDF } from "./invoicePDF";
import { IoIosCloseCircleOutline, IoIosLink } from "react-icons/io";
import { FaEye, FaRegEdit } from "react-icons/fa";

interface TransactionLine {
  id: number;
  transactionHeaderId: number;
  description: string;
  amount: number;
  type: string;
  debtorId?: number;
  creditorId?: number;
  salesInvoiceId?: number | null;
  purchaseInvoiceId?: number | null;
  transactionHeader: {
    id: number;
    date: string;
    TotalIncl: number;
    vatAmount: number;
  };
  debtor?: { companyName: string };
  creditor?: { companyName: string };
  ledger?: { name: string }
}

export default function Transaction(){
    const {user} = useUser();
    const [modalVisible, setModalVisible] = useState(false);
    const [tModalVisible, setTModalVisible] = useState(false);
    const [transactions, setTransactions] = useState<TransactionLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const { getTransactions } = useTransaction();
    const [selectedTransactionId, setSelectedTransactionId] = useState<number | undefined>();

    const [selectedTransaction, setSelectedTransaction] = useState<TransactionLine | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchTransactions();
        }
    }, [user?.id]);

    const fetchTransactions = async () => {
        if (!user?.id) return;
        
        try {
            setLoading(true);
            const data = await getTransactions(user.id);
            setTransactions(data as TransactionLine[]);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }
    
    const handleSaveTransaction = async () => {
        // Refresh transactions after saving
        await fetchTransactions();
        setModalVisible(false);
    };

    const openInvoicePreview = async (invoiceId: number, invoiceType: 'sales' | 'purchase') => {
        try {
            setLoadingInvoice(true);
            const apiCall = invoiceType === 'sales' ? 'salesInvoice:getInvoice' : 'purchaseInvoice:getInvoice';
            const fullInvoice = await window.api?.invoke(apiCall, invoiceId);
            if (fullInvoice) {
                setSelectedInvoice({ ...fullInvoice, type: invoiceType });
                setPreviewVisible(true);
            }
        } catch (error) {
            console.error("Failed to fetch invoice for preview:", error);
        } finally {
            setLoadingInvoice(false);
        }
    };
    
    return (
        <div>
            <BaseHeader
                title="Transacties"
                buttonText="Nieuwe transactie"
                searchPlaceholder="Zoek transacties via omschrijving of transactienummer..."
                subtitle="Beheer en maak nieuwe transacties"
                searchAriaLabel="Zoek transacties"
                onButtonClick={() => setModalVisible(true)}
            />

            {/* Transaction */}
            <div className={styles.transactionsContainer}>
                <table className={styles.transactionTable}>
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Omschrijving</th>
                            <th>Factuur</th>
                            <th>Bedrag</th>
                            <th>Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{transaction.transactionHeader.date.split('T')[0]}</td>
                                <td>
                                    <div className={styles.transactionInfo}>
                                        {(transaction.creditor?.companyName || transaction.debtor?.companyName) && (
                                            <h3>{transaction.creditor?.companyName || transaction.debtor?.companyName}</h3>
                                        )}
                                        {transaction.description}
                                    </div>
                                </td>
                                <td 
                                  onClick={() => {
                                    if (transaction.salesInvoiceId) {
                                      openInvoicePreview(transaction.salesInvoiceId, 'sales');
                                    } else if (transaction.purchaseInvoiceId) {
                                      openInvoicePreview(transaction.purchaseInvoiceId, 'purchase');
                                    }
                                  }}
                                  style={{ cursor: (transaction.salesInvoiceId || transaction.purchaseInvoiceId) ? 'pointer' : 'default' }}
                                >
                                    {transaction.salesInvoiceId ?
                                        <div className={styles.invoiceIcon}>
                                            <IoIosLink size={20}/>
                                        </div>
                                        :
                                        <p></p>
                                    }
                                </td>
                                <td className={transaction.amount > 0 ? styles.positive : styles.negative}>
                                    €{transaction.amount.toFixed(2)}
                                </td>
                                <td className={styles.actionsContainer}>
                                    <FaEye 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            setSelectedTransaction(transaction);
                                            setTModalVisible(true);
                                        }}
                                    />
                                    <FaRegEdit 
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            setSelectedTransactionId(transaction.transactionHeaderId);
                                            setModalVisible(true);
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedTransactionId(undefined);
                }}
                width="96vw" 
                height="auto"
            >
                <TransactionForm 
                    onSave={handleSaveTransaction}
                    onClose={() => {
                        setModalVisible(false);
                        setSelectedTransactionId(undefined);
                    }}
                    transactionId={selectedTransactionId}
                />
            </Modal>

            <Modal
                isOpen={previewVisible}
                onClose={() => setPreviewVisible(false)}
                width="96vw"
                height="96vh"
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1vw' }}>
                    <h2>{selectedInvoice?.type === 'sales' ? 'Sales Invoice' : 'Purchase Invoice'}</h2>
                    <IoIosCloseCircleOutline
                        size={30}
                        style={{ cursor: "pointer" }}
                        onClick={() => setPreviewVisible(false)}
                    />
                </div>
                {loadingInvoice ? (
                    <div>Loading invoice...</div>
                ) : selectedInvoice?.type === 'sales' ? (
                    <PDFViewer width="100%" height="100%" showToolbar={false}>
                        <InvoicePDF invoice={selectedInvoice} />
                    </PDFViewer>
                ) : (
                    <div>Purchase Invoice PDF not yet implemented</div>
                )}
            </Modal>

            <Modal 
                isOpen={tModalVisible}
                onClose={() => setTModalVisible(false)}
                width="96vw" 
                height="auto"
            >
                {selectedTransaction && (
                    <div className={styles.transactionDetailContainer}>
                        <h2>Transactiegegevens</h2>
                        
                        <div className={styles.detailSection}>
                            <h3>Header Informatie</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Datum:</span>
                                <span>{selectedTransaction.transactionHeader.date.split('T')[0]}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Totaal incl.:</span>
                                <span>€{selectedTransaction.transactionHeader.TotalIncl.toFixed(2)}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Totaal btw.:</span>
                                <span>€{selectedTransaction.transactionHeader.vatAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h3>Transactie Informatie</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Omschrijving:</span>
                                <span>{selectedTransaction.description}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Bedrag:</span>
                                <span className={selectedTransaction.amount > 0 ? styles.positive : styles.negative}>
                                    €{selectedTransaction.amount.toFixed(2)}
                                </span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Type:</span>
                                <span>{selectedTransaction.type}</span>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h3>Partijgegevens</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Crediteur:</span>
                                <span>{selectedTransaction.creditor?.companyName || '-'}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Debiteur:</span>
                                <span>{selectedTransaction.debtor?.companyName || '-'}</span>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h3>Grootboek Informatie</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Grootboekrekening:</span>
                                <span>{selectedTransaction.ledger?.name || '-'}</span>
                            </div>
                        </div>

                        <div className={styles.detailSection}>
                            <h3>Factuur Informatie</h3>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Factuurnummer:</span>
                                <span>{selectedTransaction.salesInvoiceId || selectedTransaction.purchaseInvoiceId || '-'}</span>
                            </div>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Factuurttype:</span>
                                <span>{selectedTransaction.salesInvoiceId ? 'Verkoopfactuur' : (selectedTransaction.purchaseInvoiceId ? 'Inkoopfactuur' : '-')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}