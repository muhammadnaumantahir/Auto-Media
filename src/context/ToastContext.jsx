import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info', duration = 4500) => {
      const id = nextId++;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg, duration) => push(msg, 'success', duration),
    error: (msg, duration) => push(msg, 'error', duration ?? 7000),
    info: (msg, duration) => push(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-xs shadow-lg backdrop-blur animate-fade-up flex items-start gap-2 ${
              t.type === 'success'
                ? 'border-teal/40 bg-teal/10 text-teal'
                : t.type === 'error'
                ? 'border-rose/40 bg-rose/10 text-rose'
                : 'border-border bg-raised text-ivory'
            }`}
          >
            <span className="mt-px shrink-0">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}
            </span>
            <span className="leading-snug">{t.message}</span>
            <button
              className="ml-auto text-muted hover:text-ivory shrink-0"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
