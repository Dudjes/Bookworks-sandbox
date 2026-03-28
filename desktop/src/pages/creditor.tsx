import BaseHeader from "@/components/baseHeader";
import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import MainInput from "@/components/mainInput";
import styles from "@/css/relation.module.css";
import { useUser } from "@/context/UserContext";
import { validate } from "@/utils/validate";
import { creditorFormSchema } from "@/schemas/creditor.schema";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { FaPhoneAlt, FaRegEdit } from "react-icons/fa";
import { MdDeleteForever, MdLocationOn } from "react-icons/md";
import { CiMail } from "react-icons/ci";

type CreditorForm = {
    companyName: string;
    contactPerson: string;
    kvkNumber: string;
    btwNumber: string;
    IBAN: string;
    paymentTerm: string;
    email: string;
    phonenumber: string;
    address: string;
    postcode: string;
    city: string;
    country: string;
    id?: number;
}

export default function Creditor(){
    const { user } = useUser();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCreditor, setSelectedCreditor] = useState<CreditorForm | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof CreditorForm, string>>>({});
    const [creditors, setCreditors] = useState<CreditorForm[]>([]);


    const [form,setForm] = useState<CreditorForm>({
        companyName: "",
        contactPerson: "",
        kvkNumber: "",
        btwNumber: "",
        IBAN: "",
        paymentTerm: "",
        email: "",
        phonenumber: "",
        address: "",
        postcode: "",
        city: "",
        country: "Nederland",
    })

    const closeModal = () => {
        setModalVisible(false);
        setForm({
            companyName: "",
            contactPerson: "",
            email: "",
            phonenumber: "",
            kvkNumber: "",
            address: "",
            postcode: "",
            city: "",
            country: "Nederland",
            btwNumber: "",
            IBAN: "",
            paymentTerm: "",
        });
        setSelectedCreditor(null);
    };

    const openEditModal = (creditor: CreditorForm) => {
        setSelectedCreditor(creditor);
        setForm({
            companyName: creditor.companyName,
            contactPerson: creditor.contactPerson,
            email: creditor.email,
            phonenumber: creditor.phonenumber,
            kvkNumber: creditor.kvkNumber,
            address: creditor.address,
            postcode: creditor.postcode,
            city: creditor.city,
            country: creditor.country || "Nederland",
            btwNumber: creditor.btwNumber,
            IBAN: creditor.IBAN,
            paymentTerm: String((creditor as any).paymentTerm || ""),
        });
        setModalVisible(true);
    };

    const setField = (field: keyof CreditorForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCreditor) {
            await updateCreditor();
        } else {
            await createCreditor();
        }
    };

    const updateCreditor = async () => {
        const formData = {
            ...form,
            paymentTerm: Number(form.paymentTerm || 0),
        };

        const result = validate(creditorFormSchema, formData);
        if (!result.success) {
            setErrors(result.errors as Partial<Record<keyof CreditorForm, string>>);
            return;
        }

        if (!selectedCreditor) return;

        try {
            await window.api?.invoke("creditor:updateCreditor", {
                creditorId: (selectedCreditor as any).id,
                creditor: formData,
            });
            closeModal();
            getCreditors();
        } catch (error) {
            console.error(error);
        }
    };

    const createCreditor = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const formData = {
            ...form,
            paymentTerm: Number(form.paymentTerm || 0),
        };

        const result = validate(creditorFormSchema, formData);
        if (!result.success) {
            setErrors(result.errors as Partial<Record<keyof CreditorForm, string>>);
            return;
        }

        try {
            await window.api?.invoke("creditor:createCreditor", {
                userId: user?.id,
                creditor: formData,
            });
            setModalVisible(false);
            setForm({
                companyName: "",
                contactPerson: "",
                kvkNumber: "",
                btwNumber: "",
                IBAN: "",
                paymentTerm: "",
                email: "",
                phonenumber: "",
                address: "",
                postcode: "",
                city: "",
                country: "Nederland",
            });
            getCreditors();
        } catch (error) {
            console.error(error);
        }
    }

    const getCreditors = async () => {
        try {
            const creditorList = await window.api?.invoke("creditor:getCreditors", (user?.id));
            setCreditors(creditorList as CreditorForm[]);
            console.log(creditorList);
        } catch (error) {
            console.error("creditor:getCreditor failed:", error); 
        }
    }

    useEffect(() => {
        getCreditors();
    }, [user?.id]);

    return(
        <div>
            <BaseHeader
                title="Crediteuren"
                buttonText="Nieuwe crediteur"
                searchPlaceholder="Zoek crediteuren..."
                subtitle="Beheer en maak nieuwe crediteuren"
                searchAriaLabel="Zoek crediteur"
                onButtonClick={() => {
                    setSelectedCreditor(null);
                    setModalVisible(true);
                }}
            />

            <div className={styles.relationsContainer}>
                {creditors.map((creditor) => (
                    <div className={styles.relationContainer} key={`${creditor.companyName}-${creditor.email}`}>
                        <div className={styles.relationHeader}>
                            <div className={styles.relationTitleGroup}>
                                <h3 className={styles.relationTitle}>{creditor.companyName}</h3>
                                <p className={styles.relationContact}>{creditor.contactPerson}</p>
                            </div>
                            <div className={styles.iconActions}>
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    aria-label="Crediteur bewerken"
                                    onClick={() => openEditModal(creditor)}
                                >
                                    <FaRegEdit size={18} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconButtonDelete}
                                    aria-label="Crediteur verwijderen"
                                >
                                    <MdDeleteForever size={20} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.relationTopInfo}>
                            <div className={styles.relationInfo}>
                                <CiMail />
                                <p>{creditor.email}</p>
                            </div>
                            <div className={styles.relationInfo}>
                                <FaPhoneAlt />
                                <p>{creditor.phonenumber}</p>
                            </div>
                            <div className={styles.relationInfo}>
                                <MdLocationOn />
                                <p>{creditor.address} {creditor.postcode} {creditor.city}</p>
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.metaGrid}>
                            <p className={styles.metaLabel}>KvK:</p>
                            <p className={styles.metaValue}>{creditor.kvkNumber || "-"}</p>

                            <p className={styles.metaLabel}>BTW:</p>
                            <p className={styles.metaValue}>{creditor.btwNumber || "-"}</p>

                            <p className={styles.metaLabel}>IBAN:</p>
                            <p className={styles.metaValue}>{creditor.IBAN || "-"}</p>

                            <p className={styles.metaLabel}>Betalingstermijn:</p>
                            <p className={styles.metaValue}>{(creditor as any).paymentTerm || "-"} dagen</p>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.bottomStats}>
                            <div className={styles.statItem}>
                                <p className={styles.statLabel}>Openstaand</p>
                                <p className={styles.statAmount}>EUR 0,00</p>
                            </div>
                            <div className={styles.statItem}>
                                <p className={styles.statLabel}>Facturen</p>
                                <p className={styles.statValue}>0 / 0</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={modalVisible} 
                onClose={closeModal} 
                width="65vw" 
                height="auto"
            >
                <div className={styles.modalContainer}>
                    <div className={styles.modalHeader}>
                        <h3>{selectedCreditor ? "Crediteur bewerken" : "Nieuwe crediteur"}</h3>
                        <IoIosCloseCircleOutline
                            size={30}
                            style={{ cursor: "pointer" }}
                            onClick={closeModal}
                        />
                    </div>
                    <form className="debitor-form-grid" onSubmit={handleSubmit}>
                        <MainInput label="Bedrijfsnaam" required placeholder="Bijv. Acme BV" value={form.companyName} error={errors.companyName} onChangeText={(v) => setField("companyName", v)} fullWidth />
                        <MainInput label="Contactpersoon" placeholder="Naam contactpersoon" value={form.contactPerson} error={errors.contactPerson} onChangeText={(v) => setField("contactPerson", v)} />
                        <MainInput label="E-mailadres" required type="email" placeholder="email@bedrijf.nl" value={form.email} error={errors.email} onChangeText={(v) => setField("email", v)} />
                        <MainInput label="Telefoonnummer" placeholder="+31 20 123 4567" value={form.phonenumber} error={errors.phonenumber} onChangeText={(v) => setField("phonenumber", v)} />
                        <MainInput label="KvK-nummer" placeholder="12345678" value={form.kvkNumber} error={errors.kvkNumber} onChangeText={(v) => setField("kvkNumber", v)} />
                        <MainInput label="Adres" placeholder="Straat 123" value={form.address} error={errors.address} onChangeText={(v) => setField("address", v)} fullWidth />
                        <MainInput label="Postcode" placeholder="1234 AB" value={form.postcode} error={errors.postcode} onChangeText={(v) => setField("postcode", v)} />
                        <MainInput label="Plaats" placeholder="Amsterdam" value={form.city} error={errors.city} onChangeText={(v) => setField("city", v)} />
                        <MainInput label="Land" placeholder="Nederland" value={form.country} error={errors.country} onChangeText={(v) => setField("country", v)} />
                        <MainInput label="BTW-nummer" placeholder="NL123456789B01" value={form.btwNumber} error={errors.btwNumber} onChangeText={(v) => setField("btwNumber", v)} />
                        <MainInput label="IBAN" placeholder="NL12BANK0123456789" value={form.IBAN} error={errors.IBAN} onChangeText={(v) => setField("IBAN", v)} />
                        <MainInput label="Betalingstermijn (dagen)" type="number" value={form.paymentTerm} error={errors.paymentTerm} onChangeText={(v) => setField("paymentTerm", v)} />

                        <div className={styles.actionContainer}>
                            <button 
                                type="button" 
                                onClick={closeModal}
                                className={styles.cancelButton}
                            >
                                Annuleren
                            </button>
                            <button type="submit" className={styles.submitButton}><h3>{selectedCreditor ? "Updaten" : "Aanmaken"}</h3></button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}