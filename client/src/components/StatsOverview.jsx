function formatCurrency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export default function StatsOverview({ campaigns, alerts }) {
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
  const needsAttention = campaigns.filter((c) => c.status !== 'HEALTHY').length;
  const alertsSent = alerts.filter((a) => a.status === 'SENT').length;

  const stats = [
    { label: 'Active Campaigns', value: campaigns.length, accent: 'blue' },
    { label: 'Total Spend', value: formatCurrency(totalSpend), accent: 'purple' },
    { label: 'Total Clicks', value: totalClicks, accent: 'teal' },
    { label: 'Needs Attention', value: needsAttention, accent: needsAttention > 0 ? 'red' : 'green' },
    { label: 'Alerts Sent', value: alertsSent, accent: 'amber' },
  ];

  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.label} className={`stat-card stat-${s.accent}`}>
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
