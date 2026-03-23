import { useEffect, useState } from "react";
import styles from "@/css/settings.module.css";
import { FaRegBuilding } from "react-icons/fa";
import MainInput from "@/components/mainInput";
import { IoIosSave } from "react-icons/io";
import { validate } from "@/utils/validate";
import { companySchema } from "@/schemas/company.schema";
import { useUser } from "@/context/UserContext";

type SettingsForm = {
  name: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
};

export default function Settings() {
    const [form, setForm] = useState<SettingsForm>({
        name: "",
        address: "",
        postcode: "",
        city: "",
        country: "",
        kvkNumber: "",
        btwNumber: "",
        iban: "",
        phone: "",
        email: "",
        website: "",
        logo: "",
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SettingsForm, string>>>({});
    const [logoPreview, setLogoPreview] = useState<string>("");

    const handleFieldChange = (key: keyof SettingsForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                setForm((prev) => ({ ...prev, logo: base64String }));
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const { user } = useUser();

    const handleCreateOrUpdate = async () => {
        const result = validate(companySchema, form);

        if (!result.success) {
        setErrors(result.errors as Partial<Record<keyof SettingsForm, string>>);
        return;
        }

        if (!user?.id) {
        console.error("No logged-in user id found");
        return;
        }

        setErrors({});

        try {
        const response = await window.api?.invoke("company:createOrUpdate", {
            userId: user.id,
            company: result.data, 
        });
        console.log("company:createOrUpdate response:", response);
        } catch (error) {
        console.error("company:createOrUpdate failed:", error);
        }
    };

    const getCompanyInfo = async () => {
        try {
            const company = await window.api?.invoke("company:getCompanyByUser", user?.id) as SettingsForm | null;

            if (company) {
                setForm({
                    name:      company.name      ?? "",
                    address:   company.address   ?? "",
                    postcode:  company.postcode  ?? "",
                    city:      company.city      ?? "",
                    country:   company.country   ?? "",
                    kvkNumber: company.kvkNumber ?? "",
                    btwNumber: company.btwNumber ?? "",
                    iban:      company.iban      ?? "",
                    phone:     company.phone     ?? "",
                    email:     company.email     ?? "",
                    website:   company.website   ?? "",
                    logo:      company.logo      ?? "",
                });
            }
        } catch (error) {
            console.error("company:getCompanyByUser failed:", error);
        }
    }

    useEffect(() => {
        if (user?.id) {
            getCompanyInfo();
        }
    }, [user?.id]);

    // Sync logoPreview when form.logo changes (when company data is loaded)
    useEffect(() => {
        if (form.logo && form.logo.startsWith('data:image')) {
            setLogoPreview(form.logo);
        }
    }, [form.logo]);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h1 style={{ fontWeight: 500 }}>Instellingen</h1>
        <p>Beheer je bedrijfsprofiel en applicatie-instellingen</p>
      </div>

      <div className={styles.body}>
        <div className={styles.companySettings}>
          <div className={styles.companyHeader}>
            <div className={styles.companyIcon}>
              <FaRegBuilding size={25} />
            </div>
            <div className={styles.companyHeaderText}>
              <h2 style={{ fontWeight: 500 }}>Bedrijfprofiel</h2>
              <p>Gegevens die op facturen worden weergeven</p>
            </div>
          </div>

          <div className={styles.companyForm}>
            <div className={styles.fullWidth}>
              <MainInput
                label="Bedrijfsnaam"
                required
                value={form.name}
                placeholder="Mijn Bedrijf BV"
                error={errors.name}
                onChangeText={(v) => handleFieldChange("name", v)}
              />
            </div>

            <div className={styles.companyFormGrid}>
              <MainInput
                label="Adres"
                value={form.address}
                placeholder="Hoofdstraat 1"
                error={errors.address}
                onChangeText={(v) => handleFieldChange("address", v)}
              />
              <MainInput
                label="Postcode"
                value={form.postcode}
                placeholder="1234 AB"
                error={errors.postcode}
                onChangeText={(v) => handleFieldChange("postcode", v)}
              />

              <MainInput
                label="Plaats"
                value={form.city}
                placeholder="Amsterdam"
                error={errors.city}
                onChangeText={(v) => handleFieldChange("city", v)}
              />
              <MainInput
                label="Land"
                value={form.country}
                placeholder="Nederland"
                error={errors.country}
                onChangeText={(v) => handleFieldChange("country", v)}
              />

              <MainInput
                label="KvK-nummer"
                required
                value={form.kvkNumber}
                placeholder="12345678"
                error={errors.kvkNumber}
                onChangeText={(v) => handleFieldChange("kvkNumber", v)}
              />
              <MainInput
                label="BTW-nummer"
                value={form.btwNumber}
                placeholder="NL123456789B01"
                error={errors.btwNumber}
                onChangeText={(v) => handleFieldChange("btwNumber", v)}
              />

              <MainInput
                label="IBAN"
                value={form.iban}
                placeholder="NL12ABCD0123456789"
                error={errors.iban}
                onChangeText={(v) => handleFieldChange("iban", v)}
              />
              <MainInput
                label="Telefoonnummer"
                value={form.phone}
                placeholder="+31 20 123 4567"
                error={errors.phone}
                onChangeText={(v) => handleFieldChange("phone", v)}
              />

              <MainInput
                label="E-mailadres"
                value={form.email}
                placeholder="info@mijnbedrijf.nl"
                error={errors.email}
                onChangeText={(v) => handleFieldChange("email", v)}
              />
              <MainInput
                label="Website"
                value={form.website}
                placeholder="www.mijnbedrijf.nl"
                error={errors.website}
                onChangeText={(v) => handleFieldChange("website", v)}
              />
            </div>

            <div className={styles.logoSection}>
              <label htmlFor="logo-upload" style={{ display: "block", marginBottom: "10px", fontWeight: 500 }}>
                Logo
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ marginBottom: "10px" }}
              />
              {logoPreview && (
                <div style={{ marginTop: "15px" }}>
                  <p style={{ fontSize: "14px", marginBottom: "8px" }}>Preview:</p>
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "4px" }}
                  />
                </div>
              )}
            </div>

            <button type="button" onClick={handleCreateOrUpdate}>
              <div className={styles.saveButton}>
                <IoIosSave size={20} />
                <h3>Bedrijfprofiel opslaan</h3>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
