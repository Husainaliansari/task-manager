import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '../api';

const PER_PAGE = 8;

/**
 * Loads one page of tasks plus the per-status totals for the current filters.
 * It re-fetches whenever a filter changes; call reload() after you create,
 * update or delete something.
 */
export function useTasks({ status, page, userId }) {
  const [state, setState] = useState({ tasks: [], meta: null, stats: null, loading: true, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false; // drop answers for filters the user has already moved away from
    setState((current) => ({ ...current, loading: true, error: null }));

    Promise.all([
      tasksApi.list({ status, page, per_page: PER_PAGE, user_id: userId }),
      tasksApi.stats({ user_id: userId }),
    ])
      .then(([list, stats]) => {
        if (!ignore) setState({ tasks: list.data, meta: list.meta, stats: stats.data, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState((current) => ({ ...current, loading: false, error: error.message }));
      });

    return () => {
      ignore = true;
    };
  }, [status, page, userId, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}
