import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi, assistantApi, tasksApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTasks } from '../hooks/useTasks';
import AiTaskDraft from '../components/AiTaskDraft';
import Pagination from '../components/Pagination';
import StatsCards from '../components/StatsCards';
import TaskCard from '../components/TaskCard';
import TaskFormModal from '../components/TaskFormModal';
import { Alert, ConfirmDialog, EmptyState } from '../components/ui';
import { ListChecksIcon, PlusIcon, SearchIcon, UsersIcon } from '../components/icons';
import { STATUSES, firstName, greeting, statusLabel, todayLong } from '../utils/format';

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  // Filters live in the URL, so a refresh, the back button or a shared link keeps them.
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const ownerId = isAdmin ? (searchParams.get('user') ?? '') : '';

  const { tasks, meta, stats, loading, error, reload } = useTasks({ status, page, userId: ownerId });

  const [users, setUsers] = useState(null); // admins only: owner filter + "assigned to"
  const [aiEnabled, setAiEnabled] = useState(false);
  const [form, setForm] = useState(null); // { task?, draft?, aiReason? } while the modal is open
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);

  useEffect(() => {
    assistantApi
      .status()
      .then((data) => setAiEnabled(data.enabled))
      .catch(() => setAiEnabled(false));

    if (isAdmin) {
      adminApi
        .users()
        .then((data) => setUsers(data.data))
        .catch(() => setUsers([]));
    }
  }, [isAdmin]);

  // If the current page is now empty (e.g. we deleted its last task), step back one.
  useEffect(() => {
    if (meta && meta.last_page > 0 && page > meta.last_page) setFilter({ page: meta.last_page });
  }, [meta, page]); // eslint-disable-line react-hooks/exhaustive-deps

  function setFilter(changes) {
    const next = { status, user: ownerId, page, ...changes };
    // Changing a filter (rather than the page) starts again from page 1.
    if (!('page' in changes)) next.page = 1;

    const params = {};
    if (next.status) params.status = next.status;
    if (next.user) params.user = next.user;
    if (next.page > 1) params.page = String(next.page);
    setSearchParams(params);
  }

  async function changeStatus(task, newStatus) {
    if (task.status === newStatus) return;

    setBusyTaskId(task.id);
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      toast.show(newStatus === 'done' ? `Nice work! "${task.title}" is done. 🎉` : `Moved to ${statusLabel(newStatus)}.`);
      reload();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setBusyTaskId(null);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await tasksApi.remove(toDelete.id);
      toast.show('Task deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.show(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(task, isEdit) {
    setForm(null);
    toast.show(isEdit ? 'Changes saved.' : `Added "${task.title}".`);
    reload();
  }

  const isFiltered = Boolean(status);

  return (
    <>
      <section className="page-header">
        <div>
          <p className="eyebrow">{todayLong()}</p>
          <h1>
            {greeting()}, {firstName(user.name)}
          </h1>
          <p className="muted">{summaryLine(stats, isAdmin && !ownerId)}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setForm({})}>
          <PlusIcon size={18} />
          New task
        </button>
      </section>

      {aiEnabled && <AiTaskDraft onDraft={(draft, aiReason) => setForm({ draft, aiReason })} />}

      <StatsCards stats={stats} activeStatus={status} onSelect={(value) => setFilter({ status: value })} />

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Filter by status">
          {[{ value: '', label: 'All' }, ...STATUSES].map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={status === option.value}
              className={`tab${status === option.value ? ' is-active' : ''}`}
              onClick={() => setFilter({ status: option.value })}
            >
              {option.label}
              {stats && <span className="tab__count">{stats[option.value || 'total']}</span>}
            </button>
          ))}
        </div>

        {isAdmin && users && (
          <label className="owner-filter">
            <UsersIcon size={16} className="owner-filter__icon" />
            <span className="muted">Showing tasks for</span>
            <select value={ownerId} onChange={(event) => setFilter({ user: event.target.value })}>
              <option value="">Everyone</option>
              {users.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.id === user.id ? `${person.name} (you)` : person.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}

      {loading && tasks.length === 0 ? (
        <div className="task-list" role="status" aria-label="Loading tasks">
          {[0, 1, 2].map((key) => (
            <div key={key} className="task task--skeleton" aria-hidden="true">
              <span className="skeleton skeleton--circle" />
              <div>
                <span className="skeleton skeleton--title" />
                <span className="skeleton skeleton--line" />
              </div>
            </div>
          ))}
        </div>
      ) : !error && tasks.length === 0 ? (
        <EmptyState
          icon={isFiltered ? <SearchIcon size={26} /> : <ListChecksIcon size={26} />}
          title={isFiltered ? 'Nothing here' : 'No tasks yet'}
          action={
            !isFiltered && (
              <button type="button" className="btn btn--primary" onClick={() => setForm({})}>
                <PlusIcon size={18} />
                Add a task
              </button>
            )
          }
        >
          {isFiltered ? 'No tasks match this filter. Try another status.' : 'Add your first task and start ticking things off.'}
        </EmptyState>
      ) : (
        <div className={`task-list${loading ? ' is-refreshing' : ''}`}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showOwner={isAdmin}
              busy={busyTaskId === task.id}
              onEdit={(selected) => setForm({ task: selected })}
              onDelete={setToDelete}
              onStatusChange={changeStatus}
            />
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={(value) => setFilter({ page: value })} />

      {form && (
        <TaskFormModal
          {...form}
          users={isAdmin ? users : null}
          currentUserId={user.id}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${toDelete.title}" will be gone for good. This can't be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}

function summaryLine(stats, everyone) {
  if (!stats) return 'Loading your board…';
  if (stats.total === 0) return everyone ? 'Nobody has any tasks yet.' : 'A fresh start. Nothing on your plate yet.';

  const open = stats.todo + stats.in_progress;
  if (open === 0) return everyone ? 'Every task on the team is done. 🎉' : "You're all caught up. Enjoy it! 🎉";

  const who = everyone ? 'The team has' : 'You have';
  return `${who} ${stats.todo} to do, ${stats.in_progress} in progress and ${stats.done} done.`;
}
