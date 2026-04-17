
import { Navigate} from "react-router-dom";
import { useUser } from "../context/UserContext.tsx";
import styles from "../css/Invoice.module.css";
import BaseHeader from "@/components/baseHeader.tsx";
import Modal from "@/components/Modal.tsx";
import { useEffect, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import MainInput from "@/components/mainInput.tsx";
import { FaRegEdit, FaRegEye } from "react-icons/fa";
import { BsDownload } from "react-icons/bs";
import { RiDeleteBin6Line } from "react-icons/ri";
import { validate } from "@/utils/validate.ts";
import { invoiceLineSchema, salesInvoiceSchema } from "@/schemas/invoice.schema.ts";
import { SalesInvoice as PrismaSalesInvoice, InvoiceStatus, SalesInvoiceLine as PrismaSalesInvoiceLine } from "@prisma/client";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "./invoicePDF.tsx";

type Debtor = {
  id: number,
  companyName: string,
}

type InvoiceLine = {
  id: string;
  rowDescription: string;
  quantity: number;
  price: number;
  vat: "0" | "9%" | "21%";
  lineTotalExcl: number;
  vatAmount: number;
  lineTotalIncl: number;
}

type Invoice = {
  id: number;
  invoiceNumber: string;
  companyId: number;
  debtorId: number;
  createdById: number;
  title: string;
  invoiceDate: string | Date;
  dueDate: string | Date;
  paymentTerm: number;
  subTotal: number;
  vatTotal: number;
  total: number;
  status: InvoiceStatus;
  invoiceLines?: InvoiceLine[];
  company?: {
    name: string;
    logo?: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    btwNumber?: string;
    kvkNumber?: string;
    iban?: string;
    phone?: string;
    email?: string;
  };
  debtor?: {
    id: number;
    companyName: string;
    address?: string;
    postcode?: string;
    city?: string;
    country?: string;
    btwNumber?: string;
  };
};

type InvoiceForm = {
  debtorId: string;
  invoiceDate: string;
  paymentTerm: string;
  dueDate: string;
  status: InvoiceStatus;
  title: string;
}

const defaultForm: InvoiceForm = {
  debtorId: "",
  invoiceDate: "",
  paymentTerm: "",
  dueDate: "",
  status: InvoiceStatus.DRAFT,
  title: "",
};

const defaultInvoiceLines: InvoiceLine[] = [
  {
    id: "1",
    rowDescription: "",
    quantity: 1,
    price: 0,
    vat: "21%",
    lineTotalExcl: 0,
    vatAmount: 0,
    lineTotalIncl: 0,
  }
];

export default function Invoices(){
    const { user} = useUser();
    const [modalVisible, setModalVisible] = useState(false);
    const [debitors, setDebitors] = useState<Debtor[]>([]);
    const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [modalType, setModalType] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice>();
    const [previewVisible, setPreviewVisible] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string>("");

    const [form, setForm] = useState(defaultForm);
    const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>(defaultInvoiceLines);




    const setField = (field: keyof typeof form, value: string | InvoiceStatus) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const updateInvoiceLine = (id: string, field: keyof InvoiceLine, value: any) => {
        setInvoiceLines((prev) =>
            prev.map((line) => {
                if (line.id !== id) return line;
                
                const updated = { ...line, [field]: value };
                
                //Recalculate totals when quantity or price changes
                if (field === "quantity" || field === "price") {
                    const quantity = field === "quantity" ? Number(value) : updated.quantity;
                    const price = field === "price" ? Number(value) : updated.price;
                    updated.lineTotalExcl = quantity * price;
                    
                    const vatRate = parseInt(updated.vat) / 100;
                    updated.vatAmount = updated.lineTotalExcl * vatRate;
                    updated.lineTotalIncl = updated.lineTotalExcl + updated.vatAmount;
                }
                //Recalculate when VAT changes
                else if (field === "vat") {
                    const vatRate = parseInt(value) / 100;
                    updated.vatAmount = updated.lineTotalExcl * vatRate;
                    updated.lineTotalIncl = updated.lineTotalExcl + updated.vatAmount;
                }
                
                return updated;
            })
        );
    };

    const addInvoiceLine = () => {
        const newId = Date.now().toString();
        setInvoiceLines((prev) => [
            ...prev,
            {
                id: newId,
                rowDescription: "",
                quantity: 1,
                price: 0,
                vat: "21%",
                lineTotalExcl: 0,
                vatAmount: 0,
                lineTotalIncl: 0,
            }
        ]);
    };

    const removeInvoiceLine = (id: string) => {
        setInvoiceLines((prev) => prev.filter((line) => line.id !== id));
    };

    const resetForm = () => {
        setForm(defaultForm);
        setInvoiceLines(defaultInvoiceLines);
        setModalType("");
        setSelectedInvoice(undefined);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetForm();
        setErrors({});
    };

    const validateInvoice = (invoiceData: any, lines: any[]) => {
        const validation = validate(salesInvoiceSchema, invoiceData);
        
        let linesValid = true;
        for (const line of lines) {
            const lineResult = validate(invoiceLineSchema, line);
            if (!lineResult.success) {
                console.log("Invoice line validation error:", lineResult.errors);
                linesValid = false;
                break;
            }
        }
        
        return { validation, linesValid };
    };

    const createInvoice = async (cleanInvoiceLines: any[]) => {
        const subTotal = cleanInvoiceLines.reduce((sum, line) => sum + line.lineTotalExcl, 0);
        const vatTotal = cleanInvoiceLines.reduce((sum, line) => sum + line.vatAmount, 0);
        const total = cleanInvoiceLines.reduce((sum, line) => sum + line.lineTotalIncl, 0);

        const formInvoice = {
            invoiceNumber: "",
            companyId: user?.id || 0,
            debtorId: Number(form.debtorId),
            createdById: user?.id || 0,
            title: "",
            invoiceDate: form.invoiceDate,
            dueDate: form.dueDate,
            paymentTerm: Number(form.paymentTerm),
            subTotal: subTotal,
            vatTotal: vatTotal,
            total: total,
            status: InvoiceStatus.DRAFT,
        };

        const { validation, linesValid } = validateInvoice(formInvoice, cleanInvoiceLines);

        if (!validation.success || !linesValid) {
            if (!validation.success) {
                setErrors(validation.errors as Partial<Record<keyof typeof form, string>>);
            }
            return false;
        }

        try {
            const invoiceNumber = await window.api?.invoke("salesInvoice:generateNumber", user?.id);
            console.log("Generated invoice number:", invoiceNumber);

            // Convert VAT values to Prisma enum format
            const invoiceLinesToSend = cleanInvoiceLines.map(line => ({
                ...line,
                vat: `VAT_${line.vat.replace('%', '')}` as any
            }));

            const payload = {
                userId: user?.id, 
                invoice: {
                    ...formInvoice,
                    invoiceNumber: invoiceNumber,
                    status: InvoiceStatus.DRAFT,
                }, 
                invoiceLines: invoiceLinesToSend
            };
            
            console.log("Payload to send:", JSON.stringify(payload, null, 2));
            await window.api?.invoke("salesInvoice:createInvoice", payload);
            console.log("Invoice created successfully");
            return true;
        } catch (error) {
            console.error("Error creating invoice:", error);
            return false;
        }
    };

    const updateInvoice = async (invoiceId: number, cleanInvoiceLines: any[]) => {
        const subTotal = cleanInvoiceLines.reduce((sum, line) => sum + line.lineTotalExcl, 0);
        const vatTotal = cleanInvoiceLines.reduce((sum, line) => sum + line.vatAmount, 0);
        const total = cleanInvoiceLines.reduce((sum, line) => sum + line.lineTotalIncl, 0);

        const formInvoice = {
            debtorId: Number(form.debtorId),
            title: "",
            invoiceDate: form.invoiceDate,
            dueDate: form.dueDate,
            paymentTerm: Number(form.paymentTerm),
            subTotal: subTotal,
            vatTotal: vatTotal,
            total: total,
            status: form.status,
        };

        const { validation, linesValid } = validateInvoice(formInvoice, cleanInvoiceLines);

        if (!linesValid) {
            return false;
        }

        try {
            const invoiceLinesToSend = cleanInvoiceLines.map(line => ({
                ...line,
                vat: `VAT_${line.vat.replace('%', '')}` as any
            }));

            const payload = {
                userId: user?.id,
                invoiceId: invoiceId,
                invoice: formInvoice,
                invoiceLines: invoiceLinesToSend
            };

            await window.api?.invoke("salesInvoice:updateInvoice", payload);
            console.log("Invoice updated successfully");
            return true;
        } catch (error) {
            console.error("Error updating invoice:", error);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanInvoiceLines = invoiceLines.map(({ id, ...rest }) => rest);

        let success = false;
        if (modalType === "update" && selectedInvoice) {
            success = await updateInvoice(selectedInvoice.id, cleanInvoiceLines);
        } else {
            success = await createInvoice(cleanInvoiceLines);
        }

        if (success) {
            closeModal();
            getInvoices(); // Refresh the invoice list
        }
    };

    const getDebitors = async () => {
        try {
            const debitorsList = await window.api?.invoke("debitor:getDebitors", (user?.id));
            console.log(debitorsList);
            setDebitors(debitorsList as Debtor[]);
        } catch (error) {
            console.error("debitor:getDebitors failed:", error);
        }
    }

    const getInvoices = async () => {
        try {
            const invoiceList = await window.api?.invoke("salesInvoice:getInvoices", (user?.id));
            console.log(invoiceList);
            setInvoices(invoiceList as Invoice[]);
        } catch (error) {
            console.error("invoice:getInvoices failed", error);
        }
    }

    const deleteInvoice = async (invoice: Invoice) => {
        const confirmed = window.confirm(`Weet je zeker dat je factuur ${invoice.invoiceNumber} wilt verwijderen?`);
        if (!confirmed) return;
        
        try {
            await window.api?.invoke("salesInvoice:deleteInvoice", invoice.id);
            console.log("deleting invoice");
            getInvoices();
        } catch (error) {
            console.error(error);
        }
    }

    const openUpdateModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setModalType("update");
        setModalVisible(true);
    };


    function calcDueDate(invoiceDateStr: string, paymentTerm: number) {
        const date = new Date(invoiceDateStr);
        date.setDate(date.getDate() + paymentTerm);
        return date.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
    }

    function calculateTotals() {
        const subTotal = invoiceLines.reduce((sum, line) => sum + line.lineTotalExcl, 0);
        const vatTotal = invoiceLines.reduce((sum, line) => sum + line.vatAmount, 0);
        const total = invoiceLines.reduce((sum, line) => sum + line.lineTotalIncl, 0);
        return { subTotal, vatTotal, total };
    }

    const openPreview = async (invoice: Invoice) => {
        try {
            // Fetch the full invoice with invoiceLines
            const fullInvoice = await window.api?.invoke("salesInvoice:getInvoice", invoice.id) as Invoice;
            setSelectedInvoice(fullInvoice);
            setLogoUrl(fullInvoice.company?.logo || "");
            setPreviewVisible(true);
        } catch (error) {
            console.error("Failed to fetch invoice for preview:", error);
            // Fallback to the passed invoice
            setSelectedInvoice(invoice);
            setLogoUrl(invoice.company?.logo || "");
            setPreviewVisible(true);
        }
    };


    // --------------------
    // UseEffects
    // --------------------

    useEffect(() => {
        if (form.invoiceDate && form.paymentTerm) {
            const calculatedDueDate = calcDueDate(form.invoiceDate, parseInt(form.paymentTerm));
            setField("dueDate", calculatedDueDate);
        }
    }, [form.invoiceDate, form.paymentTerm]);

    useEffect(() => {
        if(modalType === "update" && selectedInvoice){
            setForm({
                invoiceDate: new Date(selectedInvoice.invoiceDate).toISOString().split('T')[0],
                dueDate: new Date(selectedInvoice.dueDate).toISOString().split('T')[0],
                paymentTerm: selectedInvoice.paymentTerm.toString(),
                debtorId: selectedInvoice.debtorId.toString(),
                status: selectedInvoice.status,
                title: selectedInvoice.title,
            });
            // Map invoice lines from database format to form format
            const mappedLines = (selectedInvoice as any).invoiceLines?.map((line: any) => ({
                id: line.id?.toString() || Date.now().toString(),
                rowDescription: line.rowDescription,
                quantity: line.quantity,
                price: line.price,
                vat: line.vat.replace('VAT_', '').replace('0', '0%').replace('9', '9%').replace('21', '21%') as "0%" | "9%" | "21%",
                lineTotalExcl: line.lineTotalExcl,
                vatAmount: line.vatAmount,
                lineTotalIncl: line.lineTotalIncl,
            })) || defaultInvoiceLines;
            setInvoiceLines(mappedLines);
        } else {
            setForm(defaultForm);
            setInvoiceLines(defaultInvoiceLines);
        }
    }, [modalType, selectedInvoice])

    useEffect(() => {
        getDebitors();
        getInvoices();
    }, [user?.id]);



    if (!user) {
        return <Navigate to="/" replace />;
    }
    
    return(
        <div className={styles.mainContainer}>
            <BaseHeader
                title="Verkoopfacturen"
                buttonText="Nieuwe factuur"
                searchPlaceholder="Zoek facturen..."
                subtitle="Beheer en maak nieuwe klanten"
                searchAriaLabel="Zoek facturen"
                onButtonClick={() => {setModalVisible(true)}}
            ></BaseHeader>
            <div className={styles.mainTable}>
                <table>
                    <thead>
                        <tr>
                            <th>Factuurnummer</th>
                            <th>Klant</th>
                            <th>Factuur-datum</th>
                            <th>Verval-datum</th>
                            <th>Bedrag (excl.)</th>
                            <th>BTW</th>
                            <th>Totaal (incl.)</th>
                            <th>Status</th>
                            <th>Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr className={styles.tableInfoRow} key={invoice.id}>
                                <td>{invoice.invoiceNumber}</td>
                                <td>{invoice.debtor?.companyName || 'N/A'}</td>
                                <td>{new Date(invoice.invoiceDate).toLocaleDateString('nl-NL')}</td>
                                <td>{new Date(invoice.dueDate).toLocaleDateString('nl-NL')}</td>
                                <td>€ {Number(invoice.subTotal).toFixed(2)}</td>
                                <td>€ {Number(invoice.vatTotal).toFixed(2)}</td>
                                <td><strong>€ {Number(invoice.total).toFixed(2)}</strong></td>
                                <td className={styles.InvoiceStatus_open}>{invoice.status}</td>
                                <td className={styles.actions}>
                                    <FaRegEye className={styles.action} onClick={() => openPreview(invoice)}/>
                                    <FaRegEdit className={styles.action} onClick={() => openUpdateModal(invoice)}/>
                                    {invoice.status === "DRAFT" && <RiDeleteBin6Line className={styles.action} onClick={() => deleteInvoice(invoice)}/>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Form modal */}
            <Modal 
                isOpen={modalVisible}
                onClose={closeModal}
                width="75vw"
                height="auto"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className={styles.modalHeader}>
                        <h3>{modalType === "update" ? "Factuur bewerken" : "Nieuwe factuur"}</h3>
                        <IoIosCloseCircleOutline
                            size={30}
                            style={{ cursor: "pointer" }}
                            onClick={closeModal}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className={styles.invoiceForm}>
                        <div className={styles.formGroup}>
                            <div>
                                <label htmlFor="debitor-select" className={styles.formLabel}>Klant*</label>
                                <select 
                                    id="debitor-select"
                                    value={form.debtorId}
                                    onChange={(e) => setField("debtorId", e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="" disabled hidden>Selecteer een klant...</option>
                                    {debitors.map((debitor) => (
                                        <option key={debitor.id} value={debitor.id}>{debitor.companyName}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <MainInput
                                    label="Factuurdatum"
                                    type="date"
                                    value={form.invoiceDate}
                                    error={errors.invoiceDate}
                                    onChangeText={(v) => setField("invoiceDate", v)}
                                />
                            </div>
                            <div>
                                <MainInput
                                    label="Betalingstermijn (dagen)"
                                    type="number"
                                    value={form.paymentTerm}
                                    error={errors.paymentTerm}
                                    onChangeText={(v) => setField("paymentTerm", v)}
                                />
                            </div>
                            <div>
                                <MainInput
                                    label="Vervaldatum"
                                    type="date"
                                    value={form.dueDate}
                                    error={errors.dueDate}
                                    onChangeText={(v) => setField("dueDate", v)}
                                    readonly={true}
                                />
                            </div>
                            <div>
                                <MainInput
                                    label="Titel"
                                    type="text"
                                    value={form.title}
                                    error={errors.title}
                                    onChangeText={(v) => setField("title", v)}
                                />
                            </div>
                            {modalType === "update" && (
                                <div>
                                    <label htmlFor="status-select" className={styles.formLabel}>Status</label>
                                    <select 
                                        id="status-select"
                                        value={form.status}
                                        onChange={(e) => setField("status", e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value={InvoiceStatus.DRAFT}>{InvoiceStatus.DRAFT}</option>
                                        <option value={InvoiceStatus.OPEN}>{InvoiceStatus.OPEN}</option>
                                        <option value={InvoiceStatus.PAYED}>{InvoiceStatus.PAYED}</option>
                                        <option value={InvoiceStatus.DUE}>{InvoiceStatus.DUE}</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className={styles.RowContainer}>
                            <div className={styles.rowHeader}>
                                <h4 className={styles.rowTitle}>Factuurrengels</h4>
                                <button 
                                    type="button" 
                                    className={styles.addRowBtn}
                                    onClick={addInvoiceLine}
                                >
                                    + Regel toevoegen
                                </button>
                            </div>
                            <div className={styles.rowTableWrapper}>
                                <table className={styles.rowTable}>
                                    <thead>
                                        <tr className={styles.rowTableHeadRow}>
                                            <th className={styles.rowTableHeadCell}>Omschrijving</th>
                                            <th className={styles.rowTableHeadCell}>Aantal</th>
                                            <th className={styles.rowTableHeadCell}>Prijs</th>
                                            <th className={styles.rowTableHeadCell}>BTW</th>
                                            <th className={styles.rowTableHeadCell}>BTW-bedrag</th>
                                            <th className={styles.rowTableHeadCell}>Totaal</th>
                                            <th className={styles.rowTableHeadCell}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceLines.map((line) => (
                                            <tr key={line.id}>
                                                <td className={styles.rowTableCell}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Omschrijving" 
                                                        className={styles.rowInput}
                                                        value={line.rowDescription}
                                                        onChange={(e) => updateInvoiceLine(line.id, "rowDescription", e.target.value)}
                                                    />
                                                </td>
                                                <td className={styles.rowTableCell}>
                                                    <input 
                                                        type="number" 
                                                        value={line.quantity || ""}
                                                        step="1"
                                                        min="0"
                                                        className={styles.rowInput}
                                                        onChange={(e) => updateInvoiceLine(line.id, "quantity", e.target.valueAsNumber || 0)}
                                                        onBlur={(e) => {
                                                            const val = e.target.valueAsNumber || 0;
                                                            updateInvoiceLine(line.id, "quantity", val);
                                                        }}
                                                    />
                                                </td>
                                                <td className={styles.rowTableCell}>
                                                    <input 
                                                        type="number" 
                                                        value={line.price || ""}
                                                        step="0.01"
                                                        min="0"
                                                        className={styles.rowInput}
                                                        onChange={(e) => updateInvoiceLine(line.id, "price", e.target.valueAsNumber || 0)}
                                                        onBlur={(e) => {
                                                            const val = e.target.valueAsNumber || 0;
                                                            updateInvoiceLine(line.id, "price", val);
                                                        }}
                                                    />
                                                </td>
                                                <td className={styles.rowTableCell}>
                                                    <select 
                                                        className={styles.rowSelect}
                                                        value={line.vat}
                                                        onChange={(e) => updateInvoiceLine(line.id, "vat", e.target.value)}
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="9%">9%</option>
                                                        <option value="21%">21%</option>
                                                    </select>
                                                </td>
                                                <td className={styles.rowTableCell}>€ {line.vatAmount.toFixed(2)}</td>
                                                <td className={styles.rowTableCell}>€ {line.lineTotalIncl.toFixed(2)}</td>
                                                <td className={styles.rowTableCell}>
                                                    <button 
                                                        type="button" 
                                                        className={styles.deleteRowBtn}
                                                        onClick={() => removeInvoiceLine(line.id)}
                                                    >
                                                        −
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <div className={styles.actionButtons}>
                                <button 
                                    type="button" 
                                    onClick={closeModal}
                                    className={styles.buttonCancel}
                                >
                                    Annuleren
                                </button>
                                <button 
                                    type="submit"
                                    className={styles.buttonSubmit}
                                >
                                    {modalType === "update" ? "Opslaan" : "Aanmaken"}
                                </button>
                            </div>
                            <div className={styles.totalsSection}>
                                <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>Subtotaal:</span>
                                    <span className={styles.totalValue}>€ {calculateTotals().subTotal.toFixed(2)}</span>
                                </div>
                                <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>BTW-totaal:</span>
                                    <span className={styles.totalValue}>€ {calculateTotals().vatTotal.toFixed(2)}</span>
                                </div>
                                <div className={styles.totalRow}>
                                    <span className={styles.totalLabel + ' ' + styles.grandTotalLabel}>Totaal:</span>
                                    <span className={styles.totalValue + ' ' + styles.grandTotalValue}>€ {calculateTotals().total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* PDF modal */}
            <Modal
                isOpen={previewVisible}
                onClose={() => setPreviewVisible(false)}
                width="80vw"
                height="90vh"
                >
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <div className={styles.modalHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3>Factuur {selectedInvoice?.invoiceNumber}</h3>
                            <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                                <label htmlFor="logo-select" style={{ fontSize: "12px", color: "#666" }}>Logo:</label>
                                <input 
                                    id="logo-select"
                                    type="file" 
                                    accept="image/*"
                                    style={{ fontSize: "12px" }}
                                    onChange={(e) => {
                                        //  user picks a file → 
                                        // file is read and converted to Base64 → 
                                        // Base64 is saved to state → 
                                        // PDF preview updates with the new logo
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const logoData = event.target?.result as string;
                                                setLogoUrl(logoData);
                                                if (selectedInvoice) {
                                                    setSelectedInvoice({
                                                        ...selectedInvoice,
                                                        company: {
                                                            ...selectedInvoice.company,
                                                            logo: logoData
                                                        } as any
                                                    });
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* download PDF */}
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            {selectedInvoice && (
                                <PDFDownloadLink 
                                    document={<InvoicePDF invoice={selectedInvoice} />}
                                    fileName={`Factuur_${selectedInvoice.invoiceNumber}.pdf`}
                                >
                                    {({ blob, url, loading, error }) => (
                                        <button 
                                            style={{
                                                padding: "8px 16px",
                                                backgroundColor: "#4CAF50",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: loading ? "wait" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                            disabled={loading}
                                        >
                                            <BsDownload size={16} />
                                            {loading ? "Downloaden..." : "Download PDF"}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )}
                            <IoIosCloseCircleOutline
                                size={30}
                                style={{ cursor: "pointer" }}
                                onClick={() => setPreviewVisible(false)}
                            />
                        </div>
                    </div>
                    {selectedInvoice && (
                    <PDFViewer width="100%" height="100%" showToolbar={false}>
                        <InvoicePDF invoice={selectedInvoice} />
                    </PDFViewer>
                    )}
                </div>
            </Modal>
        </div>
    )
}