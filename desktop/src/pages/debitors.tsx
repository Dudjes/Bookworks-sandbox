import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext.tsx";
import BaseHeader from "@/components/baseHeader.tsx";
import MainInput from "@/components/mainInput.tsx";
import Modal from "@/components/Modal.tsx";
import { useEffect, useState } from "react";
import styles from "@/css/relation.module.css";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { validate } from "@/utils/validate.ts";
import { debitorFormSchema } from "@/schemas/debitor.schema.ts";
import { FaPhoneAlt, FaRegEdit } from "react-icons/fa";
import { MdDeleteForever, MdLocationOn } from "react-icons/md";
import { CiMail } from "react-icons/ci";
import Alert from "@/components/alert.tsx";

type DebitorForm = {
  id: number,
  companyName: string,
  contactPerson: string,
  email: string,
  phonenumber: string,
  kvkNumber: string,
  address: string,
  postcode: string,
  city: string,
  country: string,
  btwNumber: string,
  IBAN: string,
  paymentTerm: number,
}

export default function Debitors() {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DebitorForm, string>>>({});
  const [debitors, setDebitors] = useState<DebitorForm[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [selectedDebitorId, setSelectedDebitorId] = useState<number | null>(null);
  const [selectedDebitor, setSelectedDebitor] = useState<DebitorForm | null>(null);

  const [form, setForm] = useState({
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

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDebitor) {
      await updateDebitor();
    } else {
      await createDebitor();
    }
  };

  const createDebitor = async () => {
    const formData = {
      ...form,
      paymentTerm: Number(form.paymentTerm),
    };

    const result = validate(debitorFormSchema, formData);
    if (!result.success) {
      setErrors(result.errors as Partial<Record<keyof DebitorForm, string>>);
      return;
    }

    try {
      await window.api?.invoke("debitor:createDebitor", {
        userId: user?.id,
        debitor: formData,
      });
      closeModal();
      getDebitors();
    } catch (error) {
      console.error(error);
    }
  };

  const getDebitors = async () => {
    try {
      const debitorsList = await window.api?.invoke("debitor:getDebitors", (user?.id));
      setDebitors(debitorsList as DebitorForm[]);
      console.log(debitorsList);
    } catch (error) {
      console.error("debitor:getDebitors failed:", error);
    }
  }

  const deleteDebitor = async () => {
    if (!selectedDebitorId) return;

    try {
        await window.api?.invoke("debitor:deleteDebitor", selectedDebitorId);
        setSelectedDebitorId(null);
        getDebitors();
    } catch (error) {
        window.alert("Deze debiteur kan niet worden verwijderd omdat er facturen aan gekoppeld zijn.");
        setSelectedDebitorId(null);
    }
  }

  const updateDebitor = async () => {
    const formData = {
      ...form,
      paymentTerm: Number(form.paymentTerm),
    };

    const result = validate(debitorFormSchema, formData);
    if (!result.success) {
      setErrors(result.errors as Partial<Record<keyof DebitorForm, string>>);
      return;
    }

    if (!selectedDebitor) return;

    try {
      await window.api?.invoke("debitor:updateDebitor", {
        debitorId: selectedDebitor.id,
        debitor: formData,
      });
      closeModal();
      getDebitors();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (debitor: DebitorForm) => {
      setSelectedDebitor(debitor);
      setForm({
          companyName: debitor.companyName,
          contactPerson: debitor.contactPerson,
          email: debitor.email,
          phonenumber: debitor.phonenumber,
          kvkNumber: debitor.kvkNumber,
          address: debitor.address,
          postcode: debitor.postcode,
          city: debitor.city,
          country: debitor.country,
          btwNumber: debitor.btwNumber,
          IBAN: debitor.IBAN,
          paymentTerm: String(debitor.paymentTerm),
      });
      setModalVisible(true);
  };

  const closeModal = () => {
      setModalVisible(false);
      setSelectedDebitor(null);
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
  };

  useEffect(() => {
    getDebitors();
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/" replace />;
  }
  

  return (
    <div>
      <BaseHeader
        title="Debiteuren"
        buttonText="Nieuwe debiteur"
        searchPlaceholder="Zoek debiteuren..."
        subtitle="Beheer en maak nieuwe debiteuren"
        searchAriaLabel="Zoek debiteuren"
        onButtonClick={() => setModalVisible(true)}
      />
        <div className={styles.relationsContainer}>
          {debitors.map((debitor) => (
              <div className={styles.relationContainer} key={`${debitor.companyName}-${debitor.email}`}>
                <div className={styles.relationHeader}>
                  <div className={styles.relationTitleGroup}>
                    <h3 className={styles.relationTitle}>{debitor.companyName}</h3>
                    <p className={styles.relationContact}>{debitor.contactPerson}</p>
                  </div>
                  <div className={styles.iconActions}>
                    <button 
                      type="button" 
                      className={styles.iconButton} 
                      aria-label="Debiteur bewerken" 
                      onClick={() => {
                        setSelectedDebitor(debitor)
                        openEditModal(debitor);
                        setModalVisible(true)
                      }
                      }
                    >
                      <FaRegEdit size={18} />
                    </button>
                    <button 
                      type="button" 
                      className={styles.iconButtonDelete} 
                      aria-label="Debiteur verwijderen" 
                      onClick={() => {
                        setSelectedDebitorId(debitor.id);
                        setAlertVisible(true);
                      }}
                    >
                      <MdDeleteForever size={20} />
                    </button>
                  </div>
                </div>

                <div className={styles.relationTopInfo}>
                  <div className={styles.relationInfo}>
                    <CiMail />
                    <p>{debitor.email}</p>
                  </div>
                  <div className={styles.relationInfo}>
                    <FaPhoneAlt />
                    <p>{debitor.phonenumber}</p>
                  </div>
                  <div className={styles.relationInfo}>
                    <MdLocationOn />
                    <p>{debitor.address} {debitor.postcode} {debitor.city}</p>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.metaGrid}>
                  <p className={styles.metaLabel}>KvK:</p>
                  <p className={styles.metaValue}>{debitor.kvkNumber || "-"}</p>

                  <p className={styles.metaLabel}>BTW:</p>
                  <p className={styles.metaValue}>{debitor.btwNumber || "-"}</p>

                  <p className={styles.metaLabel}>IBAN:</p>
                  <p className={styles.metaValue}>{debitor.IBAN || "-"}</p>

                  <p className={styles.metaLabel}>Betalingstermijn:</p>
                  <p className={styles.metaValue}>{debitor.paymentTerm} dagen</p>
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
            <h3>{selectedDebitor ? "Debiteur bewerken" : "Nieuwe klant toevoegen"}</h3>
            <IoIosCloseCircleOutline
              size={30}
              style={{ cursor: "pointer" }}
              onClick={closeModal}
            />
          </div>

          <form className="debitor-form-grid" onSubmit={handleSubmit}>
            <MainInput
              label="Bedrijfsnaam"
              required
              placeholder="Bijv. Acme BV"
              value={form.companyName}
              error={errors.companyName}
              onChangeText={(v) => setField("companyName", v)}
              fullWidth
            />
            <MainInput
              label="Contactpersoon"
              placeholder="Naam contactpersoon"
              value={form.contactPerson}
              error={errors.contactPerson}
              onChangeText={(v) => setField("contactPerson", v)}
            />
            <MainInput
              label="E-mailadres"
              required
              type="email"
              placeholder="email@bedrijf.nl"
              value={form.email}
              error={errors.email}
              onChangeText={(v) => setField("email", v)}
            />
            <MainInput
              label="Telefoonnummer"
              placeholder="+31 20 123 4567"
              value={form.phonenumber}
              error={errors.phonenumber}
              onChangeText={(v) => setField("phonenumber", v)}
            />
            <MainInput
              label="KvK-nummer"
              placeholder="12345678"
              value={form.kvkNumber}
              error={errors.kvkNumber}
              onChangeText={(v) => setField("kvkNumber", v)}
            />
            <MainInput
              label="Adres"
              placeholder="Straat 123"
              value={form.address}
              error={errors.address}
              onChangeText={(v) => setField("address", v)}
              fullWidth
            />
            <MainInput
              label="Postcode"
              placeholder="1234 AB"
              value={form.postcode}
              error={errors.postcode}
              onChangeText={(v) => setField("postcode", v)}
            />
            <MainInput
              label="Plaats"
              placeholder="Amsterdam"
              value={form.city}
              error={errors.city}
              onChangeText={(v) => setField("city", v)}
            />
            <MainInput
              label="Land"
              placeholder="Nederland"
              value={form.country}
              error={errors.country}
              onChangeText={(v) => setField("country", v)}
            />
            <MainInput
              label="BTW-nummer"
              placeholder="NL123456789B01"
              value={form.btwNumber}
              error={errors.btwNumber}
              onChangeText={(v) => setField("btwNumber", v)}
            />
            <MainInput
              label="IBAN"
              placeholder="NL12BANK0123456789"
              value={form.IBAN}
              error={errors.IBAN}
              onChangeText={(v) => setField("IBAN", v)}
            />
            <MainInput
              label="Betalingstermijn (dagen)"
              type="number"
              value={form.paymentTerm}
              error={errors.paymentTerm}
              onChangeText={(v) => setField("paymentTerm", v)}
            />

            <div className={styles.actionContainer}>
                <button 
                    type="button" 
                    onClick={closeModal}
                    className={styles.cancelButton}
                >
                    Annuleren
                </button>
                <button type="submit" className={styles.submitButton}><h3>{selectedDebitor ? "Updaten" : "Aanmaken"}</h3></button>
            </div>
          </form>
        </div>
      </Modal>

      <Alert
          isOpen={alertVisible}
          message="Weet je zeker dat je de debiteur wil verwijderen?"
          onClose={() => setAlertVisible(false)}
          option2={{
              label: "Confirm",
              onClick: () => {
                  deleteDebitor();
                  setAlertVisible(false);
              }
          }}
      />
    </div>
  );
}