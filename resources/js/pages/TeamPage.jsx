import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Alert, Avatar, Spinner } from '../components/ui';
import { CheckCircleIcon, ShieldIcon, UsersIcon } from '../components/icons';

/** Admin: everyone on the team, how their work is going, and their role. */
export default function TeamPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setError('');
    adminApi
      .users()
      .then((data) => setUsers(data.data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  async function changeRole(person, role) {
    setSavingId(person.id);
    try {
      await adminApi.changeRole(person.id, role);
      toast.show(role === 'admin' ? `${person.name} is now an admin.` : `${person.name} is now a regular user.`);
      load();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h1>Team</h1>
          <p className="muted">Who is working on what. Click a name to see their tasks.</p>
        </div>
      </section>

      {error && <Alert onRetry={load}>{error}</Alert>}
      {!users && !error && <Spinner label="Loading the team…" />}

      {users && <TeamSummary users={users} />}

      {users && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Progress</th>
                <th className="num">To do</th>
                <th className="num">In progress</th>
                <th className="num">Done</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((person) => {
                const { total, todo, in_progress: inProgress, done } = person.task_counts;
                const percent = total ? Math.round((done / total) * 100) : 0;
                const isMe = person.id === me.id;

                return (
                  <tr key={person.id}>
                    <td>
                      <Link to={`/?user=${person.id}`} className="person">
                        <Avatar name={person.name} />
                        <span>
                          <strong>
                            {person.name}
                            {isMe && <span className="you-pill">You</span>}
                          </strong>
                          <span className="muted person__email">{person.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress" title={`${done} of ${total} done`}>
                          <span style={{ width: `${percent}%` }} />
                        </div>
                        <span className="progress-cell__label">{total ? `${percent}%` : '—'}</span>
                      </div>
                      <span className="muted small">{total ? `${done} of ${total} done` : 'No tasks yet'}</span>
                    </td>
                    <td className="num">{todo}</td>
                    <td className="num">{inProgress}</td>
                    <td className="num">{done}</td>
                    <td>
                      <select
                        className={`role-select role-select--${person.role}`}
                        value={person.role}
                        disabled={isMe || savingId === person.id}
                        title={isMe ? "You can't change your own role" : undefined}
                        onChange={(event) => changeRole(person, event.target.value)}
                        aria-label={`Role for ${person.name}`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/** Headline numbers above the table, worked out from the list we already have. */
function TeamSummary({ users }) {
  const admins = users.filter((person) => person.role === 'admin').length;
  const total = users.reduce((sum, person) => sum + person.task_counts.total, 0);
  const done = users.reduce((sum, person) => sum + person.task_counts.done, 0);

  const items = [
    { label: 'People', value: users.length, Icon: UsersIcon, tone: 'primary' },
    { label: 'Admins', value: admins, Icon: ShieldIcon, tone: 'warning' },
    { label: 'Team completion', value: total ? `${Math.round((done / total) * 100)}%` : '—', Icon: CheckCircleIcon, tone: 'success' },
  ];

  return (
    <div className="kpis">
      {items.map(({ label, value, Icon, tone }) => (
        <div key={label} className="kpi">
          <span className={`kpi__icon kpi__icon--${tone}`} aria-hidden="true">
            <Icon size={18} />
          </span>
          <span>
            <span className="kpi__value">{value}</span>
            <span className="kpi__label">{label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
