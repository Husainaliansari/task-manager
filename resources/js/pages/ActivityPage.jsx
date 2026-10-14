import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Alert, EmptyState, Spinner } from '../components/ui';
import { ActivityIcon, PencilIcon, PlusIcon, ShieldIcon, TrashIcon } from '../components/icons';
import { priorityLabel, statusLabel, timeAgo } from '../utils/format';

const ACTION_ICONS = { created: PlusIcon, updated: PencilIcon, deleted: TrashIcon, role_changed: ShieldIcon };

/** Admin: an audit trail of the changes admins made to other people's data. */
export default function ActivityPage() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    adminApi
      .activity()
      .then((data) => setEntries(data.data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Activity</h1>
          <p className="muted">Every change an admin makes to someone else's tasks or role is recorded here.</p>
        </div>
      </section>

      {error && <Alert onRetry={load}>{error}</Alert>}
      {!entries && !error && <Spinner label="Loading activity…" />}

      {entries?.length === 0 && (
        <EmptyState icon={<ActivityIcon size={26} />} title="All quiet">
          No admin actions yet. When an admin creates, edits or deletes another person's task, or changes their role, it
          shows up here. Changes to your own tasks aren't logged.
        </EmptyState>
      )}

      {entries?.length > 0 && (
        <ol className="timeline">
          {entries.map((entry) => {
            const kind = entry.action.split('.')[1];
            const Icon = ACTION_ICONS[kind] ?? ActivityIcon;

            return (
              <li key={entry.id} className="timeline__item">
                <span className={`timeline__icon timeline__icon--${kind}`} aria-hidden="true">
                  <Icon size={15} />
                </span>
                <div className="timeline__content">
                  <div className="timeline__head">
                    <p>{describe(entry)}</p>
                    <time
                      className="timeline__time"
                      dateTime={entry.created_at}
                      title={new Date(entry.created_at).toLocaleString()}
                    >
                      {timeAgo(entry.created_at)}
                    </time>
                  </div>
                  {entry.details?.changes && <ChangeList changes={entry.details.changes} />}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function describe({ action, actor, details }) {
  const who = <strong>{actor?.name ?? 'A former admin'}</strong>;
  const title = <strong>“{details.title}”</strong>;

  switch (action) {
    case 'task.created':
      return <>{who} created {title} for {details.owner}</>;
    case 'task.updated':
      return <>{who} edited {details.owner}'s task {title}</>;
    case 'task.deleted':
      return <>{who} deleted {details.owner}'s task {title}</>;
    case 'user.role_changed':
      return <>{who} changed {details.user}'s role from {details.from} to {details.to}</>;
    default:
      return <>{who} {action}</>;
  }
}

function ChangeList({ changes }) {
  const show = (field, value) => {
    if (value === null || value === '') return '—';
    if (field === 'status') return statusLabel(value);
    if (field === 'priority') return priorityLabel(value);
    return String(value);
  };

  return (
    <ul className="changes">
      {Object.entries(changes).map(([field, { from, to }]) => (
        <li key={field}>
          <span className="changes__field">{field.replace('_', ' ')}</span>
          <s>{show(field, from)}</s>
          <span aria-hidden="true">→</span>
          <span className="sr-only">changed to</span>
          <span className="changes__to">{show(field, to)}</span>
        </li>
      ))}
    </ul>
  );
}
