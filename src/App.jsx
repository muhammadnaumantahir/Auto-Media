import { HashRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Users from "./pages/Users";
import SheetSetup from "./pages/SheetSetup";
import Connectors from "./pages/Connectors";
import Dashboard from "./pages/Dashboard";
import Guides from "./pages/Guides";

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto px-10 py-10">
              <Routes>
                <Route path="/" element={<Users />} />
                <Route path="/sheet" element={<SheetSetup />} />
                <Route path="/connectors" element={<Connectors />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/guides" element={<Guides />} />
              </Routes>
            </main>
          </div>
        </div>
      </HashRouter>
    </AppProvider>
  );
}
