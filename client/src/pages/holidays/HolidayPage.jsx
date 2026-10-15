import { useMemo, useState } from 'react';
import { CalendarPlus, PartyPopper } from 'lucide-react';
import useHolidays from '../../hooks/useHolidays';
import HolidayCalendar from '../../components/holidays/HolidayCalendar';
import HolidayFormModal from '../../components/holidays/HolidayFormModal';
import HolidayList from '../../components/holidays/HolidayList';
import HolidayStats from '../../components/holidays/HolidayStats';
import UpcomingHolidays from '../../components/holidays/UpcomingHolidays';

export default function HolidayPage() {
  const holidays = useHolidays();
  const [modal, setModal] = useState({ open: false, initial: null });

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return [now - 1, now, now + 1, now + 2];
  }, []);

  const handleDelete = (holiday) => {
    if (window.confirm(`Delete the "${holiday.name}" holiday?`)) {
      holidays.removeHoliday(holiday._id);
    }
  };

  return (
    <div className="hub stack-lg holiday-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <PartyPopper size={18} />
        </span>
        <div>
          <h1>Holiday Calendar</h1>
          <p>Plan national, company and optional holidays by location and department</p>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={holidays.year}
            onChange={(event) => holidays.setYear(Number(event.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {holidays.canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <CalendarPlus size={15} className="me-1" /> Add holiday
            </button>
          )}
        </div>
      </header>

      {holidays.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {holidays.error}
        </div>
      )}

      <HolidayStats counts={holidays.counts} />

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="panel h-100">
            <div className="panel__header">
              <h3>Monthly calendar</h3>
            </div>
            <HolidayCalendar
              year={holidays.year}
              month={holidays.month}
              monthKey={holidays.monthKey}
              holidaysByDate={holidays.holidaysByDate}
              loading={holidays.loading}
              onNavigate={holidays.changeMonth}
              onGoToday={holidays.goToToday}
            />
          </div>
        </div>
        <div className="col-lg-5">
          <UpcomingHolidays
            holidays={holidays.upcoming}
            loading={holidays.loadingUpcoming}
          />
        </div>
      </div>

      <HolidayList
        grouped={holidays.grouped}
        loading={holidays.loading}
        busy={holidays.busy}
        canManage={holidays.canManage}
        filters={holidays.filters}
        meta={holidays.meta}
        onFilter={holidays.setFilter}
        onReset={holidays.resetFilters}
        onNew={() => setModal({ open: true, initial: null })}
        onEdit={(holiday) => setModal({ open: true, initial: holiday })}
        onDelete={handleDelete}
      />

      <HolidayFormModal
        open={modal.open}
        initial={modal.initial}
        meta={holidays.meta}
        saving={holidays.busy === 'holiday'}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, id) => {
          const ok = await holidays.saveHoliday(payload, id);
          if (ok) setModal({ open: false, initial: null });
        }}
      />
    </div>
  );
}