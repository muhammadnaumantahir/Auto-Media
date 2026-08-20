import { createContext, useContext, useEffect, useState } from "react";
import { watchUsers } from "../lib/firestore";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeUserId, setActiveUserId] = useState(
    () => localStorage.getItem("automedia:activeUserId") || null
  );

  useEffect(() => {
    const unsub = watchUsers((list) => {
      setUsers(list);
      setLoadingUsers(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (activeUserId) {
      localStorage.setItem("automedia:activeUserId", activeUserId);
    }
  }, [activeUserId]);

  // If no active user is chosen yet, default to the most recently created one.
  useEffect(() => {
    if (!activeUserId && users.length > 0) {
      setActiveUserId(users[0].id);
    }
  }, [users, activeUserId]);

  const activeUser = users.find((u) => u.id === activeUserId) || null;

  return (
    <AppContext.Provider
      value={{ users, loadingUsers, activeUserId, setActiveUserId, activeUser }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
