import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { watchSheetConfig } from "../lib/firestore";
import { initials, avatarColor } from "../lib/avatar";

export default function TopBar() {
  const { activeUser } = useApp();
  const [sheetConnected, setSheetConnected] = useState(false);

  useEffect(() => {
    if (!activeUser) return;
    const unsub = watchSheetConfig(activeUser.id, (cfg) => setSheetConnected(!!cfg));
    return unsub;
  }, [activeUser]);

  if (!activeUser) return null;

  const color = avatarColor(activeUser.name);
  const platformCount = (activeUser.enabledPlatforms || []).length;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-end gap-3 px-10 py-4 border-b border-border/60 bg-ink/70 backdrop-blur-md">
      <span
        className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
          sheetConnected ? "border-teal/40 text-teal bg-teal/10" : "border-border text-muted"
        }`}
      >
        sheet {sheetConnected ? "linked" : "unlinked"}
      </span>
      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-border text-muted">
        {platformCount} platform{platformCount === 1 ? "" : "s"}
      </span>
      <div className="flex items-center gap-2 pl-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-display font-semibold text-xs"
          style={{ background: color.bg, color: color.fg }}
        >
          {initials(activeUser.name)}
        </div>
        <span className="text-sm text-ivory font-medium hidden sm:inline">{activeUser.name}</span>
      </div>
    </div>
  );
}
