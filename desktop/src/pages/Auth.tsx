import { PiBookOpenTextBold } from "react-icons/pi";
import { FaChartBar, FaRegFileAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Auth.module.css";
import { useUser } from "../context/UserContext.tsx";

type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const items = [
  { icon: <FaRegFileAlt size={25}/>, title: "Facturen & Debiteuren", description: "Creëer profesionele facturen en beheer uw klanten en leveranciers" },
  { icon: <FaChartBar size={25}/>, title: "Reportages & Analyses", description: "Inzicht in uw winst & verlies, balans en cashflow" },
  { icon: <IoShieldCheckmarkOutline size={25}/>, title: "BTW-Aangifte", description: "Automatische BTW-berekeningen en overzichten voor uw aangifte" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useUser();

  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loginErrors, setLoginErrors] = useState({
    email: "",
    password: "",
  });

  const [registerErrors, setRegisterErrors] = useState({
    username: "",
    email: "",
    password: "",
  });

  const validateLoginForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };

    if (!email.trim()) {
      newErrors.email = "Email is vereist";
    } else if (!email.includes("@")) {
      newErrors.email = "Vul aub een echt email address in";
    }

    if (!password.trim()) {
      newErrors.password = "Wachtwoord is vereist";
    }

    setLoginErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const validateRegisterForm = () => {
    const newErrors = {
      username: "",
      email: "",
      password: "",
    };

    if (!username.trim()) {
      newErrors.username = "Username is vereist";
    }

    if (!email.trim()) {
      newErrors.email = "Email is vereist";
    } else if (!email.includes("@")) {
      newErrors.email = "Vul aub een echt email address in";
    }

    if (!password.trim() || password.length < 6) {
      newErrors.password = "Wachtwoord moet minimaal 6 karakters zijn";
    }

    setRegisterErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleLogin = async () => {
    if (!validateLoginForm()) {
      return;
    }

    try {
      if (!window.api?.invoke) {
        console.warn("Electron API bridge is unavailable. Login is skipped in browser-only dev mode.");
        return;
      }

      const user = await window.api.invoke("auth:loginUser", email, password) as SessionUser | null;
      if (!user) {
        setLoginErrors((prev) => ({
          ...prev,
          password: "Onjuist email of wachtwoord",
        }));
        return;
      }

      login(user);
      navigate("/settings");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) {
      return;
    }

    try {
      if (window.api?.invoke) {
        const user = await window.api.invoke("auth:registerUser", username, password, email, "user") as SessionUser;
        login(user);
      } else {
        console.warn("Electron API bridge is unavailable. Registration is skipped in browser-only dev mode.");
      }

      navigate("/settings");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("EMAIL_EXISTS")) {
        setRegisterErrors((prev) => ({
          ...prev,
          email: "Dit e-mailadres is al in gebruik",
        }));
        return;
      }

      console.error(error);
    }
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
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLoginErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="naam@bedrijf.nl"
                    className={loginErrors.email ? styles.inputError : ""}
                  />
                  {loginErrors.email && <p className={styles.fieldError}>{loginErrors.email}</p>}
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="password"><strong>Password</strong></label>
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={loginErrors.password ? styles.inputError : ""}
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
                  {loginErrors.password && <p className={styles.fieldError}>{loginErrors.password}</p>}
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
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    placeholder="Jan jansen"
                    className={registerErrors.username ? styles.inputError : ""}
                  />
                  {registerErrors.username && <p className={styles.fieldError}>{registerErrors.username}</p>}
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="email"><strong>E-mailadres</strong></label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setRegisterErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="naam@bedrijf.nl"
                    className={registerErrors.email ? styles.inputError : ""}
                  />
                  {registerErrors.email && <p className={styles.fieldError}>{registerErrors.email}</p>}
                </div>
                <div className={styles.formInfo}>
                  <label htmlFor="password"><strong>Password</strong></label>
                  <div className={styles.passwordField}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setRegisterErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={registerErrors.password ? styles.inputError : ""}
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
                  {registerErrors.password && <p className={styles.fieldError}>{registerErrors.password}</p>}
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
