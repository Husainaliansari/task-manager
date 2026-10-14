import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Alert, Field, PasswordInput } from '../components/ui';
import { validateRegistration } from '../utils/validation';
import { firstName } from '../utils/format';
import AuthLayout from './AuthLayout';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateRegistration(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.show(`Welcome aboard, ${firstName(form.name)}! Let's add your first task.`);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(error.message);
      setErrors(error.fieldErrors);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      {serverError && <Alert>{serverError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="form">
        <Field label="Your name" htmlFor="name" error={errors.name}>
          <input id="name" autoComplete="name" value={form.name} onChange={update('name')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters, with a letter and a number.">
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={update('password')} />
        </Field>
        <Field label="Confirm password" htmlFor="password_confirmation" error={errors.password_confirmation}>
          <PasswordInput
            id="password_confirmation"
            autoComplete="new-password"
            value={form.password_confirmation}
            onChange={update('password_confirmation')}
          />
        </Field>
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
