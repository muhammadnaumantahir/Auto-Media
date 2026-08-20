import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Users from "./pages/Users";
import SheetSetup from "./pages/SheetSetup";
import Connectors from "./pages/Connectors";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-10 py-10">
            <Routes>
              <Route path="/" element={<Users />} />
              <Route path="/sheet" element={<SheetSetup />} />
              <Route path="/connectors" element={<Connectors />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
