import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PLATFORMS } from "../lib/platforms";
import { GUIDES } from "../lib/guides";
import BreadcrumbPath from "../components/BreadcrumbPath";

export default function Guides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("platform") || "youtube";
  const [activeId, setActiveId] = useState(initial);

  useEffect(() => {
    const p = searchParams.get("platform");
    if (p && p !== activeId) setActiveId(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const platform = PLATFORMS.find((p) => p.id === activeId) || PLATFORMS[0];
  const guide = GUIDES[platform.id];

  function fieldLabel(key) {
    return platform.fields.find((f) => f.key === key)?.label || key;
  }

  function selectPlatform(id) {
    setActiveId(id);
    setSearchParams({ platform: id });
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-8 animate-fade-up">
        <p className="label">Setup guides</p>
        <h1 className="font-display text-2xl font-semibold">Configure each platform</h1>
        <p className="text-muted text-sm mt-1">
          Exact click-paths through each platform's own console, and which field each value goes
          into on the Connectors page. Real UI screenshots go stale within a few months of any
          console redesign, so these follow the menu labels instead — they hold up longer.
        </p>
      </header>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 animate-fade-up" style={{ animationDelay: "40ms" }}>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPlatform(p.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border whitespace-nowrap transition-colors ${
              p.id === platform.id ? "bg-raised border-border" : "border-transparent hover:bg-raised/50"
            }`}
          >
            <span
              className="w-6 h-6 rounded-md flex items-center justify-center font-display font-bold text-[10px]"
              style={{ background: `${p.color}1A`, color: p.color }}
            >
              {p.short}
            </span>
            <span className={`text-sm ${p.id === platform.id ? "text-ivory" : "text-muted"}`}>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="card p-6 mb-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <p className="label mb-3">Typical path</p>
        <BreadcrumbPath steps={guide.breadcrumb} color={platform.color} />
        <p className="text-sm text-muted mt-4">{guide.intro}</p>
      </div>

      <div className="grid gap-3">
        {guide.steps.map((step, i) => (
          <div
            key={step.title}
            className="card p-5 flex gap-4 animate-fade-up"
            style={{ animationDelay: `${100 + i * 50}ms` }}
          >
            <div
              className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-display font-semibold text-xs"
              style={{ background: `${platform.color}1A`, color: platform.color }}
            >
              {i + 1}
            </div>
            <div className="min-w-0 grow">
              <p className="text-sm font-medium text-ivory">{step.title}</p>
              {step.body && <p className="text-xs text-muted mt-1 leading-relaxed">{step.body}</p>}

              <div className="flex flex-wrap gap-2 mt-3">
                {(step.fields || []).map((fk) => (
                  <span
                    key={fk}
                    className="text-[10px] font-mono px-2 py-1 rounded-full border border-teal/40 text-teal bg-teal/10"
                  >
                    → goes in “{fieldLabel(fk)}”
                  </span>
                ))}
                {(step.links || []).map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono px-2 py-1 rounded-full border border-border text-muted hover:border-violet hover:text-ivory transition-colors"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 mt-6 border-dashed animate-fade-up" style={{ animationDelay: `${100 + guide.steps.length * 50 + 40}ms` }}>
        <p className="text-xs text-muted">
          Once you have these values, go to <span className="text-ivory font-medium">Connectors</span>,
          select {platform.name}, and paste them into the matching fields.
        </p>
      </div>
    </div>
  );
}
