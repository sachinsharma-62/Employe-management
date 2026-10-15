import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, BriefcaseBusiness, CircleDollarSign, Search as SearchIcon, Users } from 'lucide-react';
import useJobs from '../../hooks/useJobs';
import JobFormModal from '../../components/jobs/JobFormModal';
import { Badge, EmptyState, SectionLoading, StatTile } from '../../components/employees/profile/ui';
import { JOB_STATUSES, JOB_TYPES, formatDate, jobStatusLabel, jobStatusTone, jobTypeLabel } from '../../utils/constants';

export default function JobsPage() {
  const jobs = useJobs();
  const [modal, setModal] = useState({ open: false, initial: null });

  const hasFilters = jobs.filters.q || jobs.filters.status || jobs.filters.department || jobs.filters.jobType;

  const handleDelete = (job) => {
    if (window.confirm(`Close the "${job.title}" posting? Candidates stay on record.`)) {
      jobs.removeJob(job._id);
    }
  };

  return (
    <div className="hub stack-lg recruiting-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <Briefcase size={18} />
        </span>
        <div>
          <h1>Job Postings</h1>
          <p>Track open roles, hiring stages and internal candidates</p>
        </div>
        {jobs.canManage && (
          <div className="ms-auto">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <BriefcaseBusiness size={15} className="me-1" /> Post job
            </button>
          </div>
        )}
      </header>

      <div className="profile-stat-grid">
        <StatTile label="Total postings" value={jobs.stats.total} tone="indigo" icon={Briefcase} />
        <StatTile label="Open" value={jobs.stats.open} hint="actively recruiting" tone="green" icon={Users} />
        <StatTile label="Interviewing" value={jobs.stats.interviewing} tone="cyan" icon={BriefcaseBusiness} />
        <StatTile label="Openings" value={jobs.stats.openings} tone="amber" icon={CircleDollarSign} />
      </div>

      <div className="recruiting-filters">
        <div className="recruiting-filters__search">
          <SearchIcon size={15} aria-hidden="true" />
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search jobs…"
            value={jobs.filters.q}
            onChange={(event) => jobs.setFilter('q', event.target.value)}
          />
        </div>
        <select
          className="form-select form-select-sm"
          value={jobs.filters.status}
          onChange={(event) => jobs.setFilter('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {JOB_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={jobs.filters.department}
          onChange={(event) => jobs.setFilter('department', event.target.value)}
        >
          <option value="">All departments</option>
          {jobs.meta.departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={jobs.filters.jobType}
          onChange={(event) => jobs.setFilter('jobType', event.target.value)}
        >
          <option value="">All types</option>
          {JOB_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={jobs.resetFilters}>
            Reset
          </button>
        )}
      </div>

      {jobs.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {jobs.error}
        </div>
      )}

      {jobs.loading ? (
        <div className="panel">
          <SectionLoading label="Loading jobs…" />
        </div>
      ) : jobs.jobs.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Briefcase} title="No jobs found" hint="Try different filters or post a new role." />
        </div>
      ) : (
        <div className="job-grid">
          {jobs.jobs.map((job) => (
            <div className="job-card" key={job._id}>
              <div className="job-card__top">
                <Link to={`/jobs/${job._id}`} className="job-card__title">
                  {job.title}
                </Link>
                <Badge tone={jobStatusTone(job.status)}>{jobStatusLabel(job.status)}</Badge>
              </div>
              <p className="job-card__meta">
                {job.department} · {job.location || 'No location'} · {jobTypeLabel(job.jobType)}
              </p>
              {job.salaryRange && <p className="job-card__salary">{job.salaryRange}</p>}
              <div className="job-card__tags">
                {job.skills?.slice(0, 5).map((skill) => (
                  <span className="job-tag" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
              <div className="job-card__foot">
                <span>
                  {job.minExperience || 0}–{job.maxExperience || '∞'} yrs · {job.openings || 1} opening
                </span>
                <span>Closes {formatDate(job.closesOn)}</span>
              </div>
              {jobs.canManage && (
                <div className="job-card__actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setModal({ open: true, initial: job })}
                    disabled={jobs.busy === `job-${job._id}`}
                  >
                    Edit
                  </button>
                  {job.isActive && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(job)}
                      disabled={jobs.busy === `job-${job._id}`}
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <JobFormModal
        open={modal.open}
        initial={modal.initial}
        meta={jobs.meta}
        saving={jobs.busy === 'job'}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, id) => {
          const ok = await jobs.saveJob(payload, id);
          if (ok) setModal({ open: false, initial: null });
        }}
      />
    </div>
  );
}