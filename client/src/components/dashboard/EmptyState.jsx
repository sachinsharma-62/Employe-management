export default function EmptyState({ label = 'No data to display', hint }) {
  return (
    <div className="dash-empty">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}
