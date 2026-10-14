/**
 * Client-side checks that mirror the Laravel validation rules. They give
 * instant feedback; the API still validates everything (never trust the client).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateTask(task) {
  const errors = {};
  const title = task.title.trim();

  if (!title) errors.title = 'Give your task a title.';
  else if (title.length > 150) errors.title = 'Keep the title under 150 characters.';

  if (task.description.length > 2000) errors.description = 'The description can be at most 2000 characters.';

  if (task.due_date && !DATE_PATTERN.test(task.due_date)) errors.due_date = 'Pick a valid date.';

  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter the email you signed up with.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegistration({ name, email, password, password_confirmation: confirmation }) {
  const errors = {};

  if (name.trim().length < 2) errors.name = 'Tell us your name (at least 2 characters).';
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';

  if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Mix in at least one letter and one number.';
  }

  if (confirmation !== password) errors.password_confirmation = "Passwords don't match.";

  return errors;
}
