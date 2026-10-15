import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, CalendarDays, MapPin, Mail, Users } from 'lucide-react';
import jobApi from '../../api/job.api';
import candidateApi from '../../api/candidate.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import JobFormModal from '../../components/jobs/JobFormModal';
import { Badge, Detail, EmptyState, SectionLoading, StatTile } from '../../components/employees/profile/ui';
import {
  CANDIDATE_STAGES,
  candidateSourceLabel,
  candidateStageLabel,
  candidateStageTone,
  formatDate,
  jobStatusLabel,
  jobStatusTone,
  jobTypeLabel,
} from '../../utils/constants';

const PRIVILEGED = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.MANAGER];
const MANAGERS = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const canManage = MANAGERS.includes(user?.role);
  const canViewCandidates = PRIVILEGED.includes(user?.role);

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ departments: [], locations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, initial: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await jobApi.get(id);
      setJob(res.data.job);
      if (canViewCandidates && res.data.job) {
        const cands = await candidateApi.list({ job: res.data.job._id, limit: 100 });
        setCandidates(cands.data.candidates || []);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      setError(err.message || 'Could not load the job');
    } finally {
      setLoading(false);
    }
  }, [id, canViewCandidates]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    jobApi
      .meta()
      .then((res) => setMeta(res.data || { departments: [], locations: [] }))
      .catch(() => {});
  }, []);

  const handleClose = async () => {
    if (!window.confirm('Close this posting? Candidates stay on record.')) return;
    try {
      await jobApi.remove(id);
      toast.success('Job closed');
      navigate('/jobs');
    } catch (err) {
      toast.error(err.message || 'Could not close the job');
    }
  };

  const updateCandidateStage = async (candidate, stage) => {
    if (candidate.stage === stage) return;
    try {
      await candidateApi.update(candidate._id, { stage });
      toast.success('Stage updated');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update the stage');
    }
  };

  if (loading) {
    return (
      <div className="hub stack-lg">
        <div className="panel">
          <SectionLoading label="Loading job…" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="hub stack-lg">
        <div className="panel">
          <EmptyState icon={Briefcase} title="Job not found" hint={error || 'This posting may have been removed.'} />
        </div>
      </div>
    );
  }

  const exp = `${job.minExperience || 0}–${job.maxExperience || '∞'} years`;

  return (
    <div className="hub stack-lg recruiting-page">
      <header className="hub__pagehead">
        <Link to="/jobs" className="btn btn-outline-secondary btn-sm">
          <ArrowLeft size={15} className="me-1" /> All jobs
        </Link>
        <div className="ms-auto d-flex gap-2">
          {canManage && (
            <>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ open: true, initial: job })}>
                Edit
              </button>
              {job.isActive && (
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleClose}>
                  Close posting
                </button>
              )}
            </>
          )}
        </div>
      </header>

      <section className="panel job-detail">
        <div className="job-detail__head">
          <div className="job-detail__title">
            <h2>{job.title}</h2>
            <Badge tone={jobStatusTone(job.status)}>{jobStatusLabel(job.status)}</Badge>
          </div>
          <p className="job-detail__meta">
            {job.department} · {job.location || 'No location'} · {jobTypeLabel(job.jobType)}
            {job.salaryRange && <> · {job.salaryRange}</>}
          </p>
        </div>

        <div className="profile-stat-grid">
          <StatTile label="Openings" value={job.openings || 1} tone="indigo" icon={Briefcase} />
          <StatTile label="Experience" value={exp} tone="cyan" icon={Users} />
          <StatTile label="Candidates" value={job.candidateCount ?? candidates.length} tone="green" icon={Mail} />
          <StatTile label="Closes" value={formatDate(job.closesOn)} tone="amber" icon={CalendarDays} />
        </div>

        <div className="detail-grid">
          <Detail label="Department" value={job.department} />
          <Detail label="Location" value={job.location || '—'} />
          <Detail label="Job type" value={jobTypeLabel(job.jobType)} />
          <Detail label="Experience" value={exp} />
          <Detail label="Salary range" value={job.salaryRange} />
          <Detail label="Close date" value={formatDate(job.closesOn)} />
          <Detail label="Created by" value={job.createdBy ? `${job.createdBy.firstName} ${job.createdBy.lastName}` : '—'} />
        </div>

        <div className="detail-section">
          <h3>Description</h3>
          <p className={job.description ? '' : 'detail-item--empty'}>{job.description || '—'}</p>
        </div>
        <div className="detail-section">
          <h3>Requirements</h3>
          <p className={job.requirements ? '' : 'detail-item--empty'}>{job.requirements || '—'}</p>
        </div>

        {job.skills?.length > 0 && (
          <div className="detail-section">
            <h3>Skills</h3>
            <div className="job-card__tags">
              {job.skills.map((skill) => (
                <span className="job-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {canViewCandidates && (
        <section className="panel">
          <div className="panel__header">
            <h3>
              <MapPin size={15} className="me-1" /> Applied candidates ({candidates.length})
            </h3>
          </div>
          {candidates.length === 0 ? (
            <EmptyState icon={Users} title="No candidates yet" hint="Candidates added to recruiting will appear here." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle recruiting-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Contact</th>
                    <th>Source</th>
                    <th>Applied</th>
                    <th>Stage</th>
                    {canManage && <th>Move</th>}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate._id}>
                      <td>
                        <Link to={`/candidates/${candidate._id}`} className="recruiting-table__name">
                          {candidate.firstName} {candidate.lastName}
                        </Link>
                      </td>
                      <td className="text-muted small">
                        {candidate.email}
                        {candidate.phone ? <> · {candidate.phone}</> : null}
                      </td>
                      <td className="small">{candidateSourceLabel(candidate.source)}</td>
                      <td className="small">{formatDate(candidate.appliedAt)}</td>
                      <td>
                        <Badge tone={candidateStageTone(candidate.stage)}>{candidateStageLabel(candidate.stage)}</Badge>
                      </td>
                      {canManage && (
                        <td>
                          <select
                            className="form-select form-select-sm recruiting-table__stage"
                            value={candidate.stage}
                            onChange={(event) => updateCandidateStage(candidate, event.target.value)}
                          >
                            {CANDIDATE_STAGES.map((stage) => (
                              <option key={stage.value} value={stage.value}>
                                {stage.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <JobFormModal
        open={modal.open}
        initial={modal.initial}
        meta={meta}
        saving={false}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, jobId) => {
          try {
            await jobApi.update(jobId, payload);
            toast.success('Job updated');
            setModal({ open: false, initial: null });
            load();
          } catch (err) {
            toast.error(err.message || 'Could not update the job');
          }
        }}
      />
    </div>
  );
}