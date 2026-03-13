import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/auth";
import Invoices from "./pages/invoices";

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <main className="content">
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/invoices" element={<Invoices/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
