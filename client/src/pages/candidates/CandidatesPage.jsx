import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Medal, Search as SearchIcon, Send, UserPlus, Users } from 'lucide-react';
import useCandidates from '../../hooks/useCandidates';
import CandidateFormModal from '../../components/candidates/CandidateFormModal';
import Avatar from '../../components/Avatar';
import { Badge, EmptyState, SectionLoading, StatTile } from '../../components/employees/profile/ui';
import {
  CANDIDATE_SOURCES,
  CANDIDATE_STAGES,
  candidateSourceLabel,
  candidateStageLabel,
  candidateStageTone,
  formatDate,
} from '../../utils/constants';

export default function CandidatesPage() {
  const candidates = useCandidates();
  const [modal, setModal] = useState({ open: false, initial: null });

  const hasFilters =
    candidates.filters.q ||
    candidates.filters.stage ||
    candidates.filters.source ||
    candidates.filters.job;

  const handleDelete = (candidate) => {
    if (window.confirm(`Remove ${candidate.firstName} ${candidate.lastName} from the pipeline?`)) {
      candidates.removeCandidate(candidate._id);
    }
  };

  return (
    <div className="hub stack-lg recruiting-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <Users size={18} />
        </span>
        <div>
          <h1>Candidates</h1>
          <p>Review applications and move candidates through the pipeline</p>
        </div>
        {candidates.canManage && (
          <div className="ms-auto">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <UserPlus size={15} className="me-1" /> Add candidate
            </button>
          </div>
        )}
      </header>

      <div className="profile-stat-grid">
        <StatTile label="Total candidates" value={candidates.stats.total} tone="indigo" icon={Users} />
        <StatTile label="In pipeline" value={candidates.stats.inPipeline} tone="cyan" icon={Send} />
        <StatTile label="Interviews" value={candidates.stats.interviews} tone="amber" icon={Filter} />
        <StatTile label="Hired" value={candidates.stats.hired} tone="green" icon={Medal} />
      </div>

      <div className="recruiting-filters">
        <div className="recruiting-filters__search">
          <SearchIcon size={15} aria-hidden="true" />
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Search candidates…"
            value={candidates.filters.q}
            onChange={(event) => candidates.setFilter('q', event.target.value)}
          />
        </div>
        <select
          className="form-select form-select-sm"
          value={candidates.filters.stage}
          onChange={(event) => candidates.setFilter('stage', event.target.value)}
        >
          <option value="">All stages</option>
          {CANDIDATE_STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={candidates.filters.source}
          onChange={(event) => candidates.setFilter('source', event.target.value)}
        >
          <option value="">All sources</option>
          {CANDIDATE_SOURCES.map((source) => (
            <option key={source.value} value={source.value}>
              {source.label}
            </option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          value={candidates.filters.job}
          onChange={(event) => candidates.setFilter('job', event.target.value)}
        >
          <option value="">All jobs</option>
          {candidates.meta.jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={candidates.resetFilters}>
            Reset
          </button>
        )}
      </div>

      {candidates.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {candidates.error}
        </div>
      )}

      {candidates.loading ? (
        <div className="panel">
          <SectionLoading label="Loading candidates…" />
        </div>
      ) : candidates.candidates.length === 0 ? (
        <div className="panel">
          <EmptyState icon={Users} title="No candidates found" hint="Try different filters or add a new candidate." />
        </div>
      ) : (
        <div className="panel">
          <div className="table-responsive">
            <table className="table table-hover align-middle recruiting-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applying for</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th>Applied</th>
                  {candidates.canManage && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {candidates.candidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Avatar user={candidate} size={34} />
                        <div>
                          <Link to={`/candidates/${candidate._id}`} className="recruiting-table__name">
                            {candidate.firstName} {candidate.lastName}
                          </Link>
                          <div className="recruiting-table__sub">{candidate.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {candidate.job ? (
                        <Link to={`/jobs/${candidate.job._id}`} className="recruiting-table__job">
                          {candidate.job.title}
                        </Link>
                      ) : (
                        <span className="text-muted small">No job linked</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={candidateStageTone(candidate.stage)}>{candidateStageLabel(candidate.stage)}</Badge>
                    </td>
                    <td className="small">{candidateSourceLabel(candidate.source)}</td>
                    <td className="small">{formatDate(candidate.appliedAt)}</td>
                    {candidates.canManage && (
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setModal({ open: true, initial: candidate })}
                            disabled={candidates.busy === `candidate-${candidate._id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(candidate)}
                            disabled={candidates.busy === `candidate-${candidate._id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CandidateFormModal
        open={modal.open}
        initial={modal.initial}
        meta={candidates.meta}
        saving={candidates.busy === 'candidate'}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, id) => {
          const ok = await candidates.saveCandidate(payload, id);
          if (ok) setModal({ open: false, initial: null });
        }}
      />
    </div>
  );
}