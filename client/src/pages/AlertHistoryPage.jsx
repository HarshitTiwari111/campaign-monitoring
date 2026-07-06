import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertHistoryTable from '../components/AlertHistoryTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ExportButtons from '../components/ExportButtons';
import { usePolling } from '../hooks/usePolling';
import { fetchAlertHistory, fetchRules } from '../services/api';

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 15000;
const PAGE_SIZE = 15;

const EXPORT_COLUMNS = [
  { label: 'Time', value: (a) => new Date(a.sentAt).toLocaleString() },
  { label: 'Campaign', value: (a) => a.campaignName },
  { label: 'Rule', value: (a) => a.ruleName || a.ruleType },
  { label: 'Recommendation', value: (a) => a.recommendation },
  { label: 'Status', value: (a) => a.status },
];

export default function AlertHistoryPage() {
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [rules, setRules] = useState([]);
  const [campaignName, setCampaignName] = useState('');
  const [ruleType, setRuleType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchRules().then(setRules).catch(() => {});
  }, []);

  const filters = { campaignName: campaignName || undefined, ruleType: ruleType || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  const { data: response, error, loading, refresh } = usePolling(
    async () => {
      const result = await fetchAlertHistory({ page, limit: PAGE_SIZE, ...filters });
      setLastUpdated(new Date());
      return result;
    },
    POLL_INTERVAL_MS,
    [page, campaignName, ruleType, dateFrom, dateTo]
  );

  const alerts = response?.data || [];
  const pagination = response?.pagination;
  const hasActiveFilters = campaignName || ruleType || dateFrom || dateTo;

  const clearFilters = () => {
    setCampaignName('');
    setRuleType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const fetchAllForExport = async () => {
    const result = await fetchAlertHistory({ limit: 2000, ...filters });
    return result.data || [];
  };

  return (
    <div className="page">
      <PageHeader title="Alert History" subtitle="Every alert sent or attempted, most recent first" lastUpdated={lastUpdated} onRefresh={refresh} />

      {error && (
        <div className="error-banner">Could not reach the API. Is the backend server running? ({error.message})</div>
      )}

      <section>
        <div className="filter-bar">
          <label className="field field-search">
            <span>Search campaign</span>
            <input type="text" value={campaignName} onChange={handleFilterChange(setCampaignName)} placeholder="e.g. Weight Loss" />
          </label>
          <label className="field">
            <span>Rule</span>
            <select value={ruleType} onChange={handleFilterChange(setRuleType)}>
              <option value="">All rules</option>
              {rules.map((r) => (
                <option key={r._id} value={r.type}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={handleFilterChange(setDateFrom)} />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" value={dateTo} onChange={handleFilterChange(setDateTo)} />
          </label>
          {hasActiveFilters && (
            <button className="filter-clear-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <div className="field export-field">
            <span>&nbsp;</span>
            <ExportButtons
              columns={EXPORT_COLUMNS}
              rows={alerts}
              fetchAll={fetchAllForExport}
              filename="alert-history"
              title="Alert History"
            />
          </div>
        </div>

        {loading ? <LoadingSpinner label="Loading alerts…" /> : <AlertHistoryTable alerts={alerts} />}

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
