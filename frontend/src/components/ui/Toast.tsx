import { useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./useToast";
import type { ToastItem, ToastType } from "./useToast";

const ICONS: Record<ToastType, string> = {
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
  warning: "M12 9v4m0 4h.01M12 3L2 21h20L12 3z",
  info: "M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
};

const COLORS: Record<ToastType, string> = {
  success: "text-green-400 border-green-500/30 bg-green-500/10",
  error: "text-red-400 border-red-500/30 bg-red-500/10",
  warning: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
  info: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

const AUTO_DISMISS_MS = 4000;
let nextId = 0;

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`motion-safe:${toast.dismissing ? "animate-slide-out-right" : "animate-slide-in-right"}
        flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[280px] max-w-[380px]
        ${COLORS[toast.type]}`}
    >
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[toast.type]} />
      </svg>
      <p className="text-sm flex-1 text-gray-200">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-500 hover:text-gray-300 shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent overflow-hidden rounded-b-lg">
        <div
          className="h-full bg-current opacity-30 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <ToastNotification key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
