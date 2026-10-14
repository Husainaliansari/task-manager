import { STATUSES, describeDueDate, priorityLabel } from '../utils/format';
import { CalendarIcon, CheckIcon, FlagIcon, PencilIcon, TrashIcon } from './icons';
import { Avatar } from './ui';

export default function TaskCard({ task, showOwner, busy, onEdit, onDelete, onStatusChange }) {
  const due = describeDueDate(task.due_date, task.status);
  const isDone = task.status === 'done';

  return (
    <article className={`task task--${task.priority}${isDone ? ' task--done' : ''}${busy ? ' task--busy' : ''}`}>
      <button
        type="button"
        className={`check${isDone ? ' check--on' : ''}`}
        onClick={() => onStatusChange(task, isDone ? 'todo' : 'done')}
        disabled={busy}
        aria-label={isDone ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        title={isDone ? 'Mark as not done' : 'Mark as done'}
      >
        <CheckIcon size={14} strokeWidth={3} />
      </button>

      <div className="task__body">
        <h3 className="task__title">{task.title}</h3>
        {task.description && <p className="task__description">{task.description}</p>}

        <div className="task__meta">
          <span className={`chip chip--${task.priority}`}>
            <FlagIcon size={12} />
            {priorityLabel(task.priority)}
          </span>
          {due && (
            <span className={`chip chip--due due--${due.tone}`}>
              <CalendarIcon size={12} />
              {due.text}
            </span>
          )}
          {showOwner && task.owner && (
            <span className="chip chip--owner">
              <Avatar name={task.owner.name} size="xs" />
              {task.owner.name}
            </span>
          )}
        </div>
      </div>

      <div className="task__actions">
        <select
          className={`status-select status-select--${task.status}`}
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          disabled={busy}
          aria-label={`Status of "${task.title}"`}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-btn"
          onClick={() => onEdit(task)}
          disabled={busy}
          aria-label={`Edit "${task.title}"`}
          title="Edit"
        >
          <PencilIcon size={16} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={() => onDelete(task)}
          disabled={busy}
          aria-label={`Delete "${task.title}"`}
          title="Delete"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </article>
  );
}
