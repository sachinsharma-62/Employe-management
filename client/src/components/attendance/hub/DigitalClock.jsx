import { useEffect, useState } from 'react';
import { clockParts } from '../../../utils/attendanceHub';

export default function DigitalClock({ use24 = true, className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { hours, minutes, seconds, meridiem } = clockParts(now, use24);

  return (
    <div className={`hub-clock ${className}`} role="timer" aria-label="Current time">
      <span className="hub-clock__time">
        {hours}
        <span className="hub-clock__colon">:</span>
        {minutes}
        <span className="hub-clock__colon">:</span>
        {seconds}
      </span>
      {meridiem && <span className="hub-clock__meridiem">{meridiem}</span>}
    </div>
  );
}
