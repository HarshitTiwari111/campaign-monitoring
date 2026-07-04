const STATUS_STYLES = {
  HEALTHY: { className: 'status-healthy', label: 'Healthy' },
  WARNING: { className: 'status-warning', label: 'Warning' },
  CRITICAL: { className: 'status-critical', label: 'Critical' },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.HEALTHY;
  return (
    <span className={`status-badge ${style.className}`}>
      <span className="status-dot" />
      {style.label}
    </span>
  );
}
