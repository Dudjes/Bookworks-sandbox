
import { Navigate, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext.tsx";

export default function Invoices(){
    const navigate = useNavigate();
    const { user, logout } = useUser();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return(
        <div>
            <p>Ingelogde userID: {user?.userID ?? "geen"}</p>
            <button type="button" onClick={handleLogout}>Uitloggen</button>
        </div>
    )
}