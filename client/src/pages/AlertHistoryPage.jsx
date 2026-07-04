import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertHistoryTable from '../components/AlertHistoryTable';
import { usePolling } from '../hooks/usePolling';
import { fetchAlertHistory } from '../services/api';

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 15000;
const PAGE_SIZE = 15;

export default function AlertHistoryPage() {
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { data: response, error, loading, refresh } = usePolling(
    async () => {
      const result = await fetchAlertHistory({ page, limit: PAGE_SIZE });
      setLastUpdated(new Date());
      return result;
    },
    POLL_INTERVAL_MS,
    [page]
  );

  const alerts = response?.data || [];
  const pagination = response?.pagination;

  return (
    <div className="page">
      <PageHeader title="Alert History" subtitle="Every alert sent or attempted, most recent first" lastUpdated={lastUpdated} onRefresh={refresh} />

      {error && (
        <div className="error-banner">Could not reach the API. Is the backend server running? ({error.message})</div>
      )}

      <section>
        {loading ? <p className="loading-text">Loading alerts…</p> : <AlertHistoryTable alerts={alerts} />}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
