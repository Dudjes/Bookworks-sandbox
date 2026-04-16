
import { NavLink, useNavigate } from "react-router-dom";
import {
    FiGrid,
    FiFileText,
    FiUsers,
    FiDownload,
    FiUpload,
    FiRepeat,
    FiPercent,
    FiBarChart2,
    FiBookOpen,
    FiSettings,
} from "react-icons/fi";
import { IoIosLogOut } from "react-icons/io";
import { useUser } from "../context/UserContext.tsx";

type SideBarPage = {
    label: string;
    link: string;
    icon: JSX.Element;
};

export default function SideBar() {
    const navigate = useNavigate();
    const { logout } = useUser();

    const pages: SideBarPage[] = [
        { label: "Dashboard", link: "/", icon: <FiGrid size={18} /> },
        { label: "Verkoopfacturen", link: "/sales-invoices", icon: <FiFileText size={18} /> },
        { label: "Debiteuren", link: "/debitors", icon: <FiUsers size={18} /> },
        { label: "Inkoopfacturen", link: "/purchase-invoices", icon: <FiDownload size={18} /> },
        { label: "Crediteuren", link: "/creditor", icon: <FiUpload size={18} /> },
        { label: "Transacties", link: "/transactions", icon: <FiRepeat size={18} /> },
        { label: "BTW-Aangifte", link: "/", icon: <FiPercent size={18} /> },
        { label: "Rapportages", link: "/report", icon: <FiBarChart2 size={18} /> },
        { label: "Grootboek", link: "/ledger", icon: <FiBookOpen size={18} /> },
        { label: "Instellingen", link: "/settings", icon: <FiSettings size={18} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <aside className="sidebar" aria-label="Hoofd navigatie">
            <div className="sidebar__brand">
                <h1>BookWorks</h1>
                <p>Boekhoudapplicatie</p>
            </div>

            <div className="hl"></div>

            <nav className="sidebar__nav">
                {pages.map((page) => (
                    <NavLink
                        key={page.label}
                        to={page.link}
                        className={({ isActive }) =>
                            isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
                        }
                        title={page.label}
                    >
                        <span className="sidebar__icon" aria-hidden="true">
                            {page.icon}
                        </span>
                        <span>{page.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="hl"></div>

            <button type="button" className="logout" onClick={handleLogout}>
                <IoIosLogOut size={18}/>
                <p>Uitloggen</p>
            </button>
        </aside>
    );
}