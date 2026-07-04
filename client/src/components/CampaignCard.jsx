import StatusBadge from './StatusBadge';

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : 'No alerts yet';
}

const STATUS_ACCENT = {
  HEALTHY: 'accent-green',
  WARNING: 'accent-amber',
  CRITICAL: 'accent-red',
};

function SpendBar({ spend, spendLimit }) {
  if (!spendLimit) return null;

  const percent = Math.min((spend / spendLimit) * 100, 100);
  const overLimit = spend > spendLimit;
  const barClass = overLimit ? 'spend-bar-fill-red' : percent >= 75 ? 'spend-bar-fill-amber' : 'spend-bar-fill-green';

  return (
    <div className="spend-bar-wrapper">
      <div className="spend-bar-labels">
        <span>{formatCurrency(spend)} spent</span>
        <span className={overLimit ? 'spend-bar-over' : ''}>
          {overLimit ? 'Over ' : ''}
          limit {formatCurrency(spendLimit)}
        </span>
      </div>
      <div className="spend-bar-track">
        <div className={`spend-bar-fill ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function CampaignCard({ campaign }) {
  return (
    <div className={`card ${STATUS_ACCENT[campaign.status] || 'accent-green'}`}>
      <div className="card-header">
        <h3>{campaign.campaignName}</h3>
        <StatusBadge status={campaign.status} />
      </div>

      <SpendBar spend={campaign.spend} spendLimit={campaign.spendLimit} />

      <div className="card-metrics">
        <div className="metric">
          <span className="metric-label">Spend</span>
          <span className="metric-value">{formatCurrency(campaign.spend)}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Clicks</span>
          <span className="metric-value">{campaign.clicks}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Landing Clicks</span>
          <span className="metric-value">{campaign.landingClicks}</span>
        </div>
        <div className="metric">
          <span className="metric-label">GCLID Count</span>
          <span className="metric-value">{campaign.gclidCount}</span>
        </div>
      </div>
      <div className="card-recommendation">
        <span className="metric-label">Recommendation</span>
        <p>{campaign.recommendation}</p>
      </div>
      <div className="card-footer">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        Last alert: {formatTime(campaign.lastAlertTime)}
      </div>
    </div>
  );
}
