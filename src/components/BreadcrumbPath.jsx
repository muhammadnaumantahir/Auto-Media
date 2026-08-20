export default function BreadcrumbPath({ steps, color }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg border"
            style={{ borderColor: `${color}40`, color, background: `${color}0F` }}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span className="text-muted text-xs">→</span>}
        </div>
      ))}
    </div>
  );
}
