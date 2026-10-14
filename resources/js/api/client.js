/**
 * A small fetch wrapper for the Laravel API.
 *
 *  - Sends the Sanctum token as "Authorization: Bearer <token>".
 *  - Turns Laravel error responses into an ApiError with a readable message and
 *    one message per invalid field, e.g. { title: 'The title field is required.' }.
 *  - A 401 while we were logged in means the token expired or was revoked, so we
 *    tell the AuthContext, which sends the user back to the login page.
 */

const STORAGE_KEY = 'task-manager.session';

let handleUnauthorized = () => {};

export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * The token and its expiry time, kept in localStorage so a page refresh keeps
 * you logged in. Storage can be blocked (private mode), so every access is guarded.
 */
export const session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  },
  save(token, expiresAt) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt }));
    } catch {
      // Not fatal: the user just has to log in again after a refresh.
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up.
    }
  },
};

export function onUnauthorized(callback) {
  handleUnauthorized = callback;
}

export async function api(method, path, { body, query } = {}) {
  const token = session.get()?.token;

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the API running?", 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (response.ok) return data;

  if (response.status === 401 && token) handleUnauthorized();

  throw toApiError(response.status, data);
}

function toApiError(status, data) {
  // Laravel validation errors look like { message, errors: { field: ['msg', ...] } }.
  if (status === 422 && data.errors) {
    const fieldErrors = Object.fromEntries(
      Object.entries(data.errors).map(([field, messages]) => [field, messages[0]]),
    );
    return new ApiError('Please fix the highlighted fields.', status, fieldErrors);
  }

  const fallback = {
    401: 'Please log in to continue.',
    403: "You don't have permission to do that.",
    404: "We couldn't find what you were looking for.",
    429: 'Too many attempts. Please wait a minute and try again.',
  };

  const message = status >= 500 ? 'Something went wrong on our side. Please try again.' : data.message;
  return new ApiError(message || fallback[status] || `Request failed (${status}).`, status);
}

function toQueryString(query) {
  if (!query) return '';

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
