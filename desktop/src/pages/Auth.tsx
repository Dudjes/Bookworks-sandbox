import { PiBookOpenTextBold } from "react-icons/pi";
import { FaChartBar, FaRegFileAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "../css/Auth.module.css";

const items = [
  { icon: <FaRegFileAlt size={25}/>, title: "Facturen & Debiteuren", description: "Creëer profesionele facturen en beheer uw klanten en leveranciers" },
  { icon: <FaChartBar size={25}/>, title: "Reportages & Analyses", description: "Inzicht in uw winst & verlies, balans en cashflow" },
  { icon: <IoShieldCheckmarkOutline size={25}/>, title: "BTW-Aangifte", description: "Automatische BTW-berekeningen en overzichten voor uw aangifte" },
];

export default function Auth() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: make the method
    navigate("/invoices");
  };

  const handleRegister = () => {
    // TODO: make the method
    navigate("/invoices");
  };

  return (
    <div className={styles.app}>
      <div className={styles.mainContainer}>
        <div className={styles.header}>
          <PiBookOpenTextBold size={40}/>
          <h2>BookWorks</h2>
        </div>
        <div className={styles.body}>
          <div className={styles.textarea}>
            <div className={styles.textheader}>
              <h1>Professionele Boekhouding voor Nederlandse Bedrijven</h1>
              <p style={{color: "lightgray"}}>Beheer uw financiën, facturen en BTW-aangiftes op één plek</p>
            </div>
            <div className={styles.itemsContainer}>
              {items.map((item, index) => (
                <div key={index} className={styles.itemContainer}>
                  <div className={styles.itemIcon}>
                    {item.icon}
                  </div>
                  <div className={styles.itemText}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.formContainer}>
            <div className={styles.tabSwitcher}>
              <button
                className={`${styles.tabBtn}${activeTab === "login" ? " " + styles.active : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Inloggen
              </button>
              <button
                className={`${styles.tabBtn}${activeTab === "register" ? " " + styles.active : ""}`}
                onClick={() => setActiveTab("register")}
              >
                Registreren
              </button>
            </div>
            {activeTab === "login" ? (
              <div className={styles.loginForm}>
                <div className={styles.formText}>
                  <strong style={{fontSize: 25}}>Welkom terug</strong>
                  <p>Log in op uw BookWorks account</p>
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="email"><strong>E-mailadres</strong></label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@bedrijf.nl" />
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="password"><strong>Password</strong></label>
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
                <button className={styles.submitBtn} onClick={handleLogin}>
                  Inloggen
                </button>
              </div>
            ) : (
              <div className={styles.registerForm}>
                <div className={styles.formText}>
                  <strong style={{fontSize: 25}}>Account aanmaken</strong>
                  <p>Start vandaag nog met BookWorks</p>
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="username"><strong>Username</strong></label>
                  <input type="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Jan jansen" />
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="email"><strong>E-mailadres</strong></label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@bedrijf.nl" />
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="password"><strong>Password</strong></label>
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Verberg wachtwoord" : "Toon wachtwoord"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                    </button>
                  </div>
                </div>
                <button className={styles.submitBtn} onClick={handleRegister}>
                  Account Aanmaken
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer>

      </footer>
    </div>
  )
}
