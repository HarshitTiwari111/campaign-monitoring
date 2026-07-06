/**
 * Bouncing bars echo the bar-chart in the app's logo, so loading states
 * feel like part of the same brand instead of a generic OS spinner.
 */
export default function LoadingSpinner({ label, fullHeight = false }) {
  return (
    <div className={`loading-spinner-wrap${fullHeight ? ' loading-spinner-full' : ''}`}>
      <div className="loading-spinner">
        <span />
        <span />
        <span />
        <span />
      </div>
      {label && <p className="loading-spinner-label">{label}</p>}
    </div>
  );
}
