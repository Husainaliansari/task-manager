import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircleIcon, CheckIcon, XIcon } from '../components/icons';

const ToastContext = createContext(null);

let nextId = 1;

/** Small, self-dismissing confirmations ("Task saved") in the corner of the screen. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'success') => {
      const id = nextId++;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span className="toast__icon" aria-hidden="true">
              {toast.type === 'error' ? <AlertCircleIcon size={16} /> : <CheckIcon size={14} strokeWidth={3} />}
            </span>
            <span className="toast__text">{toast.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <XIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
