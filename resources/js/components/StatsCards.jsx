import { CheckCircleIcon, CircleIcon, ClockIcon, InboxIcon } from './icons';

const CARDS = [
  { key: 'total', status: '', label: 'All tasks', Icon: InboxIcon },
  { key: 'todo', status: 'todo', label: 'To do', Icon: CircleIcon },
  { key: 'in_progress', status: 'in_progress', label: 'In progress', Icon: ClockIcon },
  { key: 'done', status: 'done', label: 'Done', Icon: CheckCircleIcon },
];

/** Totals per status. Clicking a card filters the list below. */
export default function StatsCards({ stats, activeStatus, onSelect }) {
  const total = stats?.total ?? 0;
  const percentOf = (count) => (total ? Math.round((count / total) * 100) : 0);

  return (
    <div className="stats">
      {CARDS.map(({ key, status, label, Icon }) => (
        <button
          key={key}
          type="button"
          className={`stat stat--${key}${activeStatus === status ? ' is-active' : ''}`}
          onClick={() => onSelect(status)}
          aria-pressed={activeStatus === status}
        >
          <span className="stat__top">
            <span className="stat__label">{label}</span>
            <span className="stat__icon">
              <Icon size={16} />
            </span>
          </span>
          <span className="stat__value">{stats ? stats[key] : '–'}</span>
          {key === 'total' ? (
            <span className="stat__foot">
              <span className="stat__bar" aria-hidden="true">
                <span style={{ width: `${percentOf(stats?.done ?? 0)}%` }} />
              </span>
              {percentOf(stats?.done ?? 0)}% complete
            </span>
          ) : (
            <span className="stat__foot">{stats ? `${percentOf(stats[key])}% of all tasks` : ' '}</span>
          )}
        </button>
      ))}
    </div>
  );
}
