import { useEffect, useRef, useState } from 'react';
import { AlertCircleIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, InfoIcon, XIcon } from './icons';

/** Small building blocks shared across pages. */

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

const ALERT_ICONS = { error: AlertCircleIcon, info: InfoIcon, success: CheckCircleIcon };

export function Alert({ children, type = 'error', onRetry }) {
  const Icon = ALERT_ICONS[type] ?? InfoIcon;

  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} className="alert__icon" />
      <span className="alert__text">{children}</span>
      {onRetry && (
        <button type="button" className="btn btn--small btn--ghost" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="field__error">{error}</p> : hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}

/** A password input with an eye button to show or hide it. Takes the same props as <input>. */
export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible(!visible)}
        aria-label={label}
        title={label}
        aria-pressed={visible}
        aria-controls={props.id}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

const AVATAR_TONES = 6;

/** Initials in a coloured circle. The colour is picked from the name, so it stays the same everywhere. */
export function Avatar({ name = '', size = 'md' }) {
  const tone = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_TONES;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <span className={`avatar avatar--${size} avatar--tone${tone}`} aria-hidden="true">
      {initials || '?'}
    </span>
  );
}

export function Modal({ title, onClose, children, size = 'medium' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Runs once when the modal opens: focus the first field, close on Escape.
  // onClose is read through a ref so a new callback on every render doesn't
  // re-run this effect and steal focus while the user is typing.
  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.querySelector('input, textarea, select, button:not(.icon-btn)')?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={dialogRef}>
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} size="small">
      <p className="modal__text">{message}</p>
      <footer className="modal__footer">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Keep it
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty__art" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      {action}
    </div>
  );
}
