import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, Field, PasswordInput } from '../components/ui';
import { validateLogin } from '../utils/validation';
import AuthLayout from './AuthLayout';
import { ShieldIcon, UserIcon } from '../components/icons';

// Clicking one fills in the form, so trying the app takes one click and "Log in".
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com', password: 'Admin@123', Icon: ShieldIcon },
  { label: 'User', email: 'priya@example.com', password: 'Password123', Icon: UserIcon },
];

export default function LoginPage() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  function fillDemo({ email, password }) {
    setForm({ email, password });
    setErrors({});
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      // Send people back to the page they originally asked for.
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      setServerError(error.message);
      setErrors(error.fieldErrors);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {notice && !serverError && <Alert type="info">{notice}</Alert>}
      {serverError && <Alert>{serverError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="form">
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
          />
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="demo-accounts">
        <p className="demo-accounts__title">
          <span>Just looking around? Try a demo account</span>
        </p>
        <div className="demo-accounts__list">
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.email} type="button" className="demo-account" onClick={() => fillDemo(account)}>
              <span className="demo-account__icon" aria-hidden="true">
                <account.Icon size={16} />
              </span>
              <span className="demo-account__text">
                <strong>{account.label}</strong>
                <span>
                  {account.email} · {account.password}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
