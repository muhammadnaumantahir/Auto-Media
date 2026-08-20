import { PLATFORMS } from "../lib/platforms";

export default function PlatformPicker({ selected, onToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {PLATFORMS.map((p) => {
        const isOn = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            aria-pressed={isOn}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all duration-150 ${
              isOn
                ? "border-transparent bg-raised shadow-glow"
                : "border-border bg-surface/40 hover:border-muted"
            }`}
            style={isOn ? { boxShadow: `0 0 0 1.5px ${p.color}55, 0 8px 24px -8px ${p.color}66` } : undefined}
          >
            {isOn && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-ink"
                style={{ background: p.color }}
              >
                ✓
              </span>
            )}
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm"
              style={{ background: `${p.color}1A`, color: p.color }}
            >
              {p.short}
            </span>
            <span className={`text-xs font-medium ${isOn ? "text-ivory" : "text-muted"}`}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
