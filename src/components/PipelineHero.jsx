const platforms = [
  { label: "YT", color: "#FF3B30" },
  { label: "IG", color: "#E1306C" },
  { label: "FB", color: "#3B82F6" },
  { label: "TT", color: "#E9ECF5" },
  { label: "SC", color: "#F5A623" },
];

export default function PipelineHero() {
  return (
    <div className="card p-6 overflow-hidden relative">
      <svg
        viewBox="0 0 720 160"
        className="w-full h-auto"
        role="img"
        aria-label="Pipeline from spreadsheet row to five connected platforms"
        tabIndex={0}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="g-sheet" x1="0" x2="1">
            <stop offset="0%" stopColor="#0f1720" />
            <stop offset="100%" stopColor="#0b0f1a" />
          </linearGradient>
          <linearGradient id="g-queue" x1="0" x2="1">
            <stop offset="0%" stopColor="#101428" />
            <stop offset="100%" stopColor="#151930" />
          </linearGradient>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* sheet node */}
        <g>
          <rect x="8" y="52" width="120" height="56" rx="10" fill="url(#g-sheet)" stroke="#2A3350" />
          <text x="68" y="76" textAnchor="middle" className="fill-ivory" style={{ font: "600 12px 'Space Grotesk'" }}>
            Sheet row
          </text>
          <text x="68" y="94" textAnchor="middle" className="fill-teal" style={{ font: "500 10px 'JetBrains Mono'" }}>
            status: queued
          </text>
        </g>

        {/* queue node */}
        <g>
          <rect x="300" y="52" width="120" height="56" rx="10" fill="url(#g-queue)" stroke="#7C5CFF" />
          <text x="360" y="76" textAnchor="middle" className="fill-ivory" style={{ font: "600 12px 'Space Grotesk'" }}>
            Auto-Media queue
          </text>
          <text x="360" y="94" textAnchor="middle" className="fill-violet" style={{ font: "500 10px 'JetBrains Mono'" }}>
            fan-out ×5
          </text>
        </g>

        {/* line: sheet -> queue (base + accent) */}
        <g aria-hidden="true">
          <line x1="128" y1="80" x2="300" y2="80" stroke="#2A3350" strokeWidth="2" />
          <line x1="128" y1="80" x2="300" y2="80" stroke="#2DD4BF" strokeWidth="2" strokeDasharray="6 6" className="animate-dash" />
        </g>

        {/* lines: queue -> platforms */}
        {platforms.map((p, i) => {
          const targetY = 18 + i * 30;
          const pathD = `M420,80 C 500,80 480,${targetY} 592,${targetY}`;
          return (
            <g key={p.label}>
              <path d={pathD} fill="none" stroke="#2A3350" strokeWidth="2" />
              <path
                d={pathD}
                fill="none"
                stroke={p.color}
                strokeWidth="2"
                strokeDasharray="5 7"
                className="animate-dash"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
              <g transform={`translate(592,${targetY})`}>
                <circle cx="12" cy="0" r="14" fill="#141A2A" stroke={p.color} strokeWidth="1.5" />
                <text x="12" y={4} textAnchor="middle" style={{ font: "700 9px 'Space Grotesk'", fill: p.color }}>
                  {p.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
