import { useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import useEvents from '../../hooks/useEvents';
import EventCalendar from '../../components/events/EventCalendar';
import EventFormModal from '../../components/events/EventFormModal';
import EventList from '../../components/events/EventList';
import EventStats from '../../components/events/EventStats';
import UpcomingEvents from '../../components/events/UpcomingEvents';

export default function EventPage() {
  const events = useEvents();
  const [modal, setModal] = useState({ open: false, initial: null });

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now - 1, now, now + 1, now + 2];
  }, []);

  const handleDelete = (event) => {
    if (window.confirm(`Delete the "${event.name}" event?`)) {
      events.removeEvent(event._id);
    }
  };

  return (
    <div className="hub stack-lg event-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <CalendarDays size={18} />
        </span>
        <div>
          <h1>Company Events</h1>
          <p>Plan outings, meetings, trainings, workshops and celebrations on a shared calendar</p>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={events.year}
            onChange={(e) => events.setYear(Number(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {events.canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <CalendarPlus size={15} className="me-1" /> Create event
            </button>
          )}
        </div>
      </header>

      {events.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {events.error}
        </div>
      )}

      <EventStats counts={events.counts} />

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="panel h-100">
            <div className="panel__header">
              <h3>Monthly calendar</h3>
            </div>
            <EventCalendar
              year={events.year}
              month={events.month}
              monthKey={events.monthKey}
              eventsByDate={events.eventsByDate}
              loading={events.loading}
              onNavigate={events.changeMonth}
              onGoToday={events.goToToday}
            />
          </div>
        </div>
        <div className="col-lg-5">
          <UpcomingEvents events={events.upcoming} loading={events.loadingUpcoming} />
        </div>
      </div>

      <EventList
        grouped={events.grouped}
        loading={events.loading}
        busy={events.busy}
        canManage={events.canManage}
        filters={events.filters}
        onFilter={events.setFilter}
        onReset={events.resetFilters}
        onNew={() => setModal({ open: true, initial: null })}
        onEdit={(event) => setModal({ open: true, initial: event })}
        onDelete={handleDelete}
      />

      <EventFormModal
        open={modal.open}
        initial={modal.initial}
        employees={events.employees}
        saving={events.busy === 'event'}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, id) => {
          const ok = await events.saveEvent(payload, id);
          if (ok) setModal({ open: false, initial: null });
        }}
      />
    </div>
  );
}
