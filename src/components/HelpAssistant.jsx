import { useState } from 'react';
import { searchAssistant } from '../lib/searchAssistant';

export default function HelpAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);

  function handleAsk(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const matches = searchAssistant(q);
    setHistory((h) => [...h, { query: q, matches }]);
    setQuery('');
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open ? (
        <div className="w-[340px] max-h-[70vh] card p-0 flex flex-col shadow-2xl border-violet/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <p className="font-display font-semibold text-sm">Help</p>
              <p className="text-[11px] text-muted">
                Searches your setup guides — not a live AI, just fast answers from real docs.
              </p>
            </div>
            <button className="text-muted hover:text-ivory" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
            {history.length === 0 && (
              <p className="text-xs text-muted">
                Ask things like "how do I connect youtube" or "what does ready mean".
              </p>
            )}
            {history.map((h, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-ivory mb-2">{h.query}</p>
                {h.matches.length === 0 ? (
                  <p className="text-xs text-muted">
                    No match in the guides yet — try the Guides page in the sidebar.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {h.matches.map((m) => (
                      <div key={m.id} className="rounded-lg border border-border p-3 bg-raised/40">
                        <p className="text-xs font-medium text-teal mb-1">{m.question}</p>
                        <p className="text-xs text-muted leading-relaxed">{m.answer}</p>
                        {m.link && (
                          <a
                            href={m.link}
                            className="text-[11px] font-mono text-violet mt-2 inline-block hover:underline"
                          >
                            {m.linkLabel} →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAsk} className="border-t border-border p-3 flex gap-2 shrink-0">
            <input
              className="input text-xs"
              placeholder="Ask a question…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn-primary text-xs shrink-0" type="submit">
              Ask
            </button>
          </form>
        </div>
      ) : (
        <button
          className="w-12 h-12 rounded-full bg-gradient-to-br from-violet to-teal flex items-center justify-center shadow-lg font-display font-bold text-ink"
          onClick={() => setOpen(true)}
          aria-label="Open help"
        >
          ?
        </button>
      )}
    </div>
  );
}
