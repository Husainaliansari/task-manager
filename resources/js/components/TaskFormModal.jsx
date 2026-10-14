import { useState } from 'react';
import { tasksApi } from '../api';
import { Alert, Field, Modal } from './ui';
import { SparklesIcon } from './icons';
import { PRIORITIES, STATUSES } from '../utils/format';
import { validateTask } from '../utils/validation';

const EMPTY_TASK = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '', user_id: '' };

/**
 * Create or edit a task.
 *  - task:     the task being edited (leave out to create a new one)
 *  - draft:    pre-filled values, e.g. from the AI assistant
 *  - aiReason: the assistant's short explanation, shown above the form
 *  - users:    who the task can be assigned to (admins only)
 */
export default function TaskFormModal({ task, draft, aiReason, users, currentUserId, onClose, onSaved }) {
  const isEdit = Boolean(task);
  const [values, setValues] = useState(() => toFormValues(task ?? { ...EMPTY_TASK, ...draft }, currentUserId));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) => {
    setValues({ ...values, [field]: event.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      status: values.status,
      priority: values.priority,
      due_date: values.due_date || null,
    };
    if (users) payload.user_id = Number(values.user_id);

    setSaving(true);
    try {
      const { data } = isEdit ? await tasksApi.update(task.id, payload) : await tasksApi.create(payload);
      onSaved(data, isEdit);
    } catch (error) {
      setServerError(error.message);
      setErrors(error.fieldErrors);
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="form modal__body">
        {aiReason && (
          <div className="ai-note">
            <SparklesIcon size={16} className="ai-note__icon" />
            <span>
              <strong>Drafted by the assistant.</strong> {aiReason} Have a look and change anything before saving.
            </span>
          </div>
        )}
        {serverError && <Alert>{serverError}</Alert>}

        <Field label="Title" htmlFor="title" error={errors.title}>
          <input id="title" value={values.title} onChange={update('title')} maxLength={150} placeholder="What needs doing?" />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description} hint="Optional. Add any details or context.">
          <textarea id="description" rows={3} value={values.description} onChange={update('description')} maxLength={2000} />
        </Field>

        <div className="form__row">
          <Field label="Status" htmlFor="status" error={errors.status}>
            <select id="status" value={values.status} onChange={update('status')}>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" htmlFor="priority" error={errors.priority}>
            <select id="priority" value={values.priority} onChange={update('priority')}>
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date" htmlFor="due_date" error={errors.due_date}>
            <input id="due_date" type="date" value={values.due_date} onChange={update('due_date')} />
          </Field>
        </div>

        {users && (
          <Field label="Assigned to" htmlFor="user_id" error={errors.user_id}>
            <select id="user_id" value={values.user_id} onChange={update('user_id')}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.id === currentUserId ? `${user.name} (you)` : `${user.name} (${user.email})`}
                </option>
              ))}
            </select>
          </Field>
        )}

        <footer className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add task'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

/** API task (nulls, numbers) -> controlled form values (always strings). */
function toFormValues(task, currentUserId) {
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    status: task.status ?? 'todo',
    priority: task.priority ?? 'medium',
    due_date: task.due_date ?? '',
    user_id: String(task.user_id || currentUserId),
  };
}
