import BaseHeader from "@/components/baseHeader";
import { useEffect, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import styles from "../css/ledger.module.css"
import { useUser } from "../context/UserContext.tsx";
import { FaEdit } from "react-icons/fa";
import Modal from "@/components/Modal.tsx";
import MainInput from "@/components/mainInput.tsx";
import { validate } from "@/utils/validate.ts";
import { ledgerSchema } from "@/schemas/ledger.schema.ts";
import { IoIosCloseCircleOutline } from "react-icons/io";
import Alert from "@/components/alert.tsx";

type ledgerForm = {
    id: number,
    number: number,
    name: string,
    type: string,
    category: string,
    systemMade: boolean,
    balance?: number
}

export default function Ledger(){
    const { user} = useUser();

    const [ledgers, setLedgers] = useState<ledgerForm[]>([]); 
    const [modalVisible, setModalVisible] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [selectedLedgerId, setSelectedLedgerId] = useState<number | null>(null);
    const [selectedLedger, setSelectedLedger] = useState<ledgerForm | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof ledgerForm, string>>>({});
    const [form, setForm] = useState({
        number: "",
        name: "",
        type: "B",
        category: "",
    });

    const setField = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLedger) {
            await updateLedger();
        } else {
            await createLedger();
        }
    };

    const createLedger = async () => {
        const formData = {
            number: Number(form.number),
            name: form.name,
            type: form.type,
            category: form.category,
        };

        const result = validate(ledgerSchema, formData);
        if (!result.success) {
            setErrors(result.errors as Partial<Record<keyof ledgerForm, string>>);
            return;
        }

        try {
            await window.api?.invoke("ledger:createLedger", {
                userId: user?.id,
                ledger: formData,
            });
            closeModal();
            getLedgers();
        } catch (error: any) {
            const errorMessage = error?.message || "Er is een fout opgetreden";
            if (errorMessage.includes("number") || errorMessage.includes("nummer")) {
                setErrors((prev) => ({ ...prev, number: "Dit rekeningnummer bestaat al" }));
            } else {
                console.error(error);
            }
        }
    };

    const updateLedger = async () => {
        if (!selectedLedger) return;

        const formData = {
            number: Number(form.number),
            name: form.name,
            type: form.type,
            category: form.category,
        };

        const result = validate(ledgerSchema, formData);
        if (!result.success) {
            setErrors(result.errors as Partial<Record<keyof ledgerForm, string>>);
            return;
        }

        try {
            await window.api?.invoke("ledger:updateLedger", {
                userId: user?.id,
                ledgerId: selectedLedger.id,
                ledger: formData,
            });
            closeModal();
            getLedgers();
        } catch (error: any) {
            const errorMessage = error?.message || "Er is een fout opgetreden";
            if (errorMessage.includes("number") || errorMessage.includes("nummer")) {
                setErrors((prev) => ({ ...prev, number: "Dit rekeningnummer bestaat al" }));
            } else {
                console.error(error);
            }
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedLedger(null);
        setForm({
            number: "",
            name: "",
            type: "B",
            category: "",
        });
        setErrors({});
    };
    
    const openModal = () => {
        setSelectedLedger(null);
        setForm({
            number: "",
            name: "",
            type: "B",
            category: "",
        });
        setErrors({});
        setModalVisible(true);
    };

    const handleEditClick = (ledger: ledgerForm) => {
        setSelectedLedger(ledger);
        setForm({
            number: String(ledger.number),
            name: ledger.name,
            type: ledger.type,
            category: ledger.category,
        });
        setErrors({});
        setModalVisible(true);
    };

    const handleDeleteClick = (ledgerId: number) => {
        setSelectedLedgerId(ledgerId);
        setAlertVisible(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await window.api?.invoke("ledger:deleteLedger", {
                userId: user?.id,
                ledgerId: selectedLedgerId,
            });
            getLedgers();
            setAlertVisible(false);
            setSelectedLedgerId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelDelete = () => {
        setAlertVisible(false);
        setSelectedLedgerId(null);
    };

    const getLedgers = async () => {
        try {
            const ledgerList = await window.api?.invoke("ledger:getLedgers", user?.id);
            
            // Fetch balance for each ledger
            const ledgersWithBalance = await Promise.all(
                (ledgerList as ledgerForm[]).map(async (ledger) => {
                    try {
                        const balance = (await window.api?.invoke("transaction:getLedgerBalance", ledger.id)) as number;
                        return { ...ledger, balance: balance || 0 };
                    } catch (error) {
                        console.error(`Failed to fetch balance for ledger ${ledger.id}:`, error);
                        return { ...ledger, balance: 0 };
                    }
                })
            );
            
            setLedgers(ledgersWithBalance);
            console.log(ledgersWithBalance);
        } catch (error) {
            console.error("ledger:getLedgers failed", error);
        }
    }

    useEffect( () => {
        getLedgers();
    },[user?.id]);

    // Helper function to format currency
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // group ledgers by category
    const grouped = ledgers.reduce((acc, ledger) => {
        if (!acc[ledger.category]) acc[ledger.category] = [];
        acc[ledger.category].push(ledger);
        return acc;
    }, {} as Record<string, ledgerForm[]>);

    // Calculate category totals
    const getCategoryTotal = (items: ledgerForm[]): number => {
        return items.reduce((sum, ledger) => sum + (ledger.balance || 0), 0);
    };

    return(
        <div>
            <BaseHeader
                title="Rekeningschema (Grootboek)"
                buttonText="Nieuwe factuur"
                searchPlaceholder="Zoek op nummer, naam of categorie"
                subtitle="Beheer en maak nieuwe klanten"
                searchAriaLabel="Zoek rekeningen"
                onButtonClick={openModal}
            ></BaseHeader>

            <Modal isOpen={modalVisible} onClose={closeModal} width="50vw">
                <div className={styles.modalHeader}>
                    <h2>{selectedLedger ? "Rekening bewerken" : "Nieuwe rekening"}</h2>
                    <button onClick={closeModal} className={styles.closeBtn}>
                        <IoIosCloseCircleOutline />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    <MainInput
                        label="Rekeningnummer"
                        required
                        placeholder="Bijv. 1000"
                        value={form.number}
                        onChangeText={(value) => setField("number", value)}
                        type="number"
                        error={errors.number}
                        fullWidth
                        readonly={selectedLedger?.systemMade === true}
                    />
                    <MainInput
                        label="Rekeningnaam"
                        required
                        placeholder="Bijv. Kas"
                        value={form.name}
                        onChangeText={(value) => setField("name", value)}
                        error={errors.name}
                        fullWidth
                    />
                    <div className={styles.formGroup}>
                        <label htmlFor="type" className={styles.label}>Type <span className={styles.required}>*</span></label>
                        <select
                            id="type"
                            value={form.type}
                            onChange={(e) => setField("type", e.target.value)}
                            className={styles.select}
                            disabled={selectedLedger?.systemMade === true}
                        >
                            <option value="Debet">Debet</option>
                            <option value="Credit">Credit</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="category" className={styles.label}>Categorie <span className={styles.required}>*</span></label>
                        <select
                            id="category"
                            value={form.category}
                            onChange={(e) => setField("category", e.target.value)}
                            className={styles.select}
                            disabled={selectedLedger?.systemMade === true}
                        >
                            <option value="">Selecteer een categorie</option>
                            {Array.from(new Set(ledgers.map((l) => l.category))).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        {errors.category && <span className={styles.error}>{errors.category}</span>}
                    </div>
                    <div className={styles.buttonGroup}>
                        <button type="submit" className={styles.submitBtn}>{selectedLedger ? "Bijwerken" : "Opslaan"}</button>
                        <button type="button" onClick={closeModal} className={styles.cancelBtn}>Annuleren</button>
                    </div>
                </form>
            </Modal>

            <Alert
                isOpen={alertVisible}
                message="Weet je zeker dat je deze rekening wilt verwijderen?"
                onClose={handleCancelDelete}
                option2={{
                    label: "Verwijderen",
                    onClick: handleConfirmDelete
                }}
            />

            <div className={styles.ledgersContainer}>
                {Object.entries(grouped).map(([category, items]) => (
                    <div key={category} className={styles.categorySection}>
                        <div className={styles.categoryHeader}>
                            <h3>▸ {category}</h3>
                            <span>Total: {formatCurrency(getCategoryTotal(items))}</span>
                        </div>
                        <table className={styles.table}>
                            <colgroup>
                                <col style={{ width: '80px' }} />
                                <col style={{ width: '220px' }} />
                                <col style={{ width: '120px' }} />
                                <col style={{ width: '120px' }} />
                                <col style={{ width: '100px' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th><strong>Nummer</strong></th>
                                    <th><strong>Rekeningnaam</strong></th>
                                    <th><strong>Type</strong></th>
                                    <th><strong>Saldo</strong></th>
                                    <th><strong>Acties</strong></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((ledger) => (
                                    <tr key={ledger.id}>
                                        <td>{ledger.number}</td>
                                        <td><span>{ledger.name}</span> {ledger.systemMade && <span className={styles.badge}>Systeem</span>}</td>
                                        <td>{ledger.type === 'B' ? 'Debet' : 'Credit'}</td>
                                        <td>{formatCurrency(ledger.balance || 0)}</td>
                                        <td>
                                            <button 
                                                className={styles.iconBtn} 
                                                onClick={() => handleDeleteClick(ledger.id)}
                                                disabled={ledger.systemMade}
                                                style={{ opacity: ledger.systemMade ? 0.5 : 1, cursor: ledger.systemMade ? 'not-allowed' : 'pointer' }}
                                            >
                                                <FiTrash2 />
                                            </button>
                                            <button 
                                                className={styles.iconBtn} 
                                                onClick={() => handleEditClick(ledger)}
                                                type="button"
                                            >
                                                <FaEdit />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}