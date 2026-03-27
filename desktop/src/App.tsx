import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Auth from "./pages/Auth";
import Invoices from "./pages/invoices";
import Debitors from "./pages/debitors";
import { UserProvider } from "./context/UserContext.tsx";
import SideBar from "./components/sideBar";
import Settings from "./pages/settings";
import Creditor from "./pages/creditor.tsx";
function AppShell() {
  const location = useLocation();
  const showSidebar = location.pathname !== "/";

  return (
    <div className="layout">
      {showSidebar && <SideBar />}
      <main className="content" style={{ marginLeft: showSidebar ? "var(--sidebar-width)" : "0" }}>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/debitors" element={<Debitors />} />
          <Route path="/creditor" element={<Creditor />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </UserProvider>
  );
}
