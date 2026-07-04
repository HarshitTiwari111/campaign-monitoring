export default function PageHeader({ title, subtitle, lastUpdated, onRefresh }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {onRefresh && (
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              <span className="live-dot" />
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button className="refresh-btn" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      )}
    </header>
  );
}
