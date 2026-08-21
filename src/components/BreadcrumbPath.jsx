export default function BreadcrumbPath({ steps = [], color = "#8b5cf6" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className="label inline-flex items-center px-2.5 py-1 rounded-lg"
            style={{ border: `1px solid ${color}40`, color, background: `${color}0F` }}
            aria-current={i === steps.length - 1 ? "step" : undefined}
          >
            {s}
          </span>
          {i < steps.length - 1 && (
            <span className="text-muted text-xs" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
