import { ChevronLeftIcon, ChevronRightIcon } from './icons';

/** Previous / next buttons driven by Laravel's paginator `meta` block. */
export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: page, last_page: lastPage, from, to, total } = meta;

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="muted">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
      <div className="pagination__buttons">
        <button type="button" className="btn btn--ghost btn--small" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon size={16} />
          Previous
        </button>
        <span className="pagination__page">
          Page {page} of {lastPage}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </nav>
  );
}
