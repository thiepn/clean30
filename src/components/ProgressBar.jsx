export default function ProgressBar({ percent = 0, label = "" }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="progress-block" aria-label={label || `Progress ${safePercent}%`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${safePercent}%` }} />
      </div>
      {label ? <span className="progress-label">{label}</span> : null}
    </div>
  );
}
