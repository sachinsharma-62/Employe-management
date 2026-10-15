const DAY_START = 8 * 60;
const DAY_END = 20 * 60;

const clampPct = (value) => Math.min(100, Math.max(0, value));

export default function AttendanceTimeline({ record }) {
  if (!record || record.checkIn == null) {
    return (
      <div className="hub-timeline hub-timeline--empty" aria-hidden="true">
        <span className="hub-timeline__bar" style={{ left: 0, width: '100%' }} />
      </div>
    );
  }

  const now = new Date();
  const currentMin = Math.min(DAY_END, Math.max(DAY_START, now.getHours() * 60 + now.getMinutes()));
  const checkOutVal = record.checkOut != null ? record.checkOut : currentMin;

  const span = DAY_END - DAY_START;
  const left = clampPct(((record.checkIn - DAY_START) / span) * 100);
  const right = clampPct(((checkOutVal - DAY_START) / span) * 100);
  const width = Math.max(3, right - left);
  const gross = Math.max(1, checkOutVal - record.checkIn);
  const breakOffset =
    gross > 0
      ? clampPct(((gross / 2 - (record.breakMinutes || 0) / 2) / gross) * 100)
      : 50;

  return (
    <div className="hub-timeline" aria-hidden="true">
      {[25, 50, 75].map((tick) => (
        <span key={tick} className="hub-timeline__tick" style={{ left: `${tick}%` }} />
      ))}
      <span
        className={`hub-timeline__bar ${record.checkOut == null ? 'is-active' : ''}`}
        style={{ left: `${left}%`, width: `${width}%` }}
      >
        {record.breakMinutes > 0 && (
          <span
            className="hub-timeline__break"
            style={{ left: `${breakOffset}%` }}
          />
        )}
      </span>
    </div>
  );
}
