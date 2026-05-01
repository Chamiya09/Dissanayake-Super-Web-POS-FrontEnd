import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CircleCheck, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastInput =
  | string
  | {
      message?: string;
      type?: ToastType;
      title?: string;
    };

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  title?: string;
};

type ToastContextValue = {
  showToast: (msgOrObj: ToastInput, type?: ToastType, title?: string) => void;
  toasts: Toast[];
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msgOrObj: ToastInput, type: ToastType = 'info', title?: string) => {
    let message = msgOrObj;
    let toastType = type;
    let toastTitle = title;

    if (typeof msgOrObj === 'object' && msgOrObj !== null) {
      message = msgOrObj.message || '';
      toastType = msgOrObj.type || 'info';
      toastTitle = msgOrObj.title;
    }

    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message: String(message ?? ''), type: toastType, title: toastTitle }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
    }, 2800); // Trigger animation right before 3000ms removal
    return () => clearTimeout(timer);
  }, []);

  const getTheme = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CircleCheck className="h-5 w-5 mt-px shrink-0 text-emerald-500" />,
          titleColor: 'text-emerald-700',
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          icon: <XCircle className="h-5 w-5 mt-px shrink-0 text-rose-500" />,
          titleColor: 'text-rose-700',
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 mt-px shrink-0 text-amber-500" />,
          titleColor: 'text-amber-700',
          defaultTitle: 'Warning',
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-5 w-5 mt-px shrink-0 text-indigo-500" />,
          titleColor: 'text-indigo-700',
          defaultTitle: 'Info',
        };
    }
  };

  const theme = getTheme(toast.type);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 bg-white rounded-xl shadow-lg border border-slate-100 transition-all duration-300 ease-in-out ${
        isLeaving ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100 animate-in slide-in-from-top-4'
      }`}
    >
      {theme.icon}
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${theme.titleColor}`}>
          {toast.title || theme.defaultTitle}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-800 leading-snug">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        title="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
