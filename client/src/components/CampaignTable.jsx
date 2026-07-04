import StatusBadge from './StatusBadge';

function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatTime(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

/**
 * `mediaBuyers` + `onAssign` are only passed by admins (see OverviewPage) -
 * media buyers get the plain read-only table without the assignment column.
 */
export default function CampaignTable({ campaigns, mediaBuyers, onAssign }) {
  const showAssignment = Boolean(mediaBuyers && onAssign);

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Live?</th>
            <th>Spend</th>
            <th>Clicks</th>
            <th>Landing Clicks</th>
            <th>GCLID Count</th>
            <th>Recommendation</th>
            <th>Status</th>
            <th>Last Alert Time</th>
            {showAssignment && <th>Assigned To</th>}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.campaignId}>
              <td>{c.campaignName}</td>
              <td>
                <span className={`live-pill ${c.campaignStatus === 'ENABLED' ? 'live-pill-on' : 'live-pill-off'}`}>
                  <span className="live-pill-dot" />
                  {c.campaignStatus === 'ENABLED' ? 'Live' : c.campaignStatus === 'PAUSED' ? 'Paused' : 'Removed'}
                </span>
              </td>
              <td>{formatCurrency(c.spend)}</td>
              <td>{c.clicks}</td>
              <td>{c.landingClicks}</td>
              <td>{c.gclidCount}</td>
              <td>{c.recommendation}</td>
              <td>
                <StatusBadge status={c.status} />
              </td>
              <td>{formatTime(c.lastAlertTime)}</td>
              {showAssignment && (
                <td>
                  <select
                    className="assign-select"
                    value={c.assignedTo?.userId || ''}
                    onChange={(e) => onAssign(c.campaignId, e.target.value || null)}
                  >
                    <option value="">Unassigned</option>
                    {mediaBuyers.map((buyer) => (
                      <option key={buyer._id} value={buyer._id}>
                        {buyer.name}
                      </option>
                    ))}
                  </select>
                </td>
              )}
            </tr>
          ))}
          {campaigns.length === 0 && (
            <tr>
              <td colSpan={showAssignment ? 10 : 9} className="empty-row">
                No campaign data yet. Waiting for the next monitoring cycle…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
