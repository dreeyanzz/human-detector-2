import { createContext, useContext, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  dismissing?: boolean;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (type: ToastType, message: string) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  addToast: () => {},
  dismissToast: () => {},
});

export function useToast() {
  const ctx = useContext(ToastContext);
  return {
    success: useCallback((msg: string) => ctx.addToast("success", msg), [ctx]),
    error: useCallback((msg: string) => ctx.addToast("error", msg), [ctx]),
    warning: useCallback((msg: string) => ctx.addToast("warning", msg), [ctx]),
    info: useCallback((msg: string) => ctx.addToast("info", msg), [ctx]),
  };
}
