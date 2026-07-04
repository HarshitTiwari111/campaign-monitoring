function formatTime(value) {
  return new Date(value).toLocaleString();
}

export default function AlertHistoryTable({ alerts }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Campaign</th>
            <th>Rule</th>
            <th>Recommendation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert._id}>
              <td>{formatTime(alert.sentAt)}</td>
              <td>{alert.campaignName}</td>
              <td>{alert.ruleName || alert.ruleType}</td>
              <td>{alert.recommendation}</td>
              <td>
                <span className={`pill ${alert.status === 'SENT' ? 'pill-success' : 'pill-error'}`}>
                  {alert.status}
                </span>
              </td>
            </tr>
          ))}
          {alerts.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                No alerts sent yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
