import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import candidateApi from '../../api/candidate.api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import CandidateFormModal from '../../components/candidates/CandidateFormModal';
import Avatar from '../../components/Avatar';
import { Badge, Detail, EmptyState, SectionLoading } from '../../components/employees/profile/ui';
import {
  CANDIDATE_STAGES,
  candidateSourceLabel,
  candidateStageLabel,
  candidateStageTone,
  formatDate,
} from '../../utils/constants';

const MANAGERS = [ROLES.SUPER_ADMIN, ROLES.HR_ADMIN];

export default function CandidateProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const canManage = MANAGERS.includes(user?.role);

  const [candidate, setCandidate] = useState(null);
  const [meta, setMeta] = useState({ jobs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ open: false, initial: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await candidateApi.get(id);
      setCandidate(res.data.candidate);
    } catch (err) {
      setError(err.message || 'Could not load the candidate');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    candidateApi
      .meta()
      .then((res) => setMeta(res.data || { jobs: [] }))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${candidate.firstName} ${candidate.lastName}?`)) return;
    try {
      await candidateApi.remove(id);
      toast.success('Candidate removed');
      navigate('/candidates');
    } catch (err) {
      toast.error(err.message || 'Could not remove the candidate');
    }
  };

  const updateStage = async (stage) => {
    if (!candidate || candidate.stage === stage) return;
    try {
      await candidateApi.update(id, { stage });
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
          <SectionLoading label="Loading candidate…" />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="hub stack-lg">
        <div className="panel">
          <EmptyState icon={UserPlus} title="Candidate not found" hint={error || 'This candidate may have been removed.'} />
        </div>
      </div>
    );
  }

  return (
    <div className="hub stack-lg recruiting-page">
      <header className="hub__pagehead">
        <Link to="/candidates" className="btn btn-outline-secondary btn-sm">
          <ArrowLeft size={15} className="me-1" /> All candidates
        </Link>
        {canManage && (
          <div className="ms-auto d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setModal({ open: true, initial: candidate })}>
              Edit
            </button>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </header>

      <section className="panel candidate-card">
        <div className="candidate-card__head">
          <Avatar user={candidate} size={56} />
          <div>
            <h2>
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p>
              {candidate.job ? (
                <>
                  Applying for{' '}
                  <Link to={`/jobs/${candidate.job._id}`} className="recruiting-table__job">
                    {candidate.job.title}
                  </Link>
                </>
              ) : (
                'No job linked'
              )}
            </p>
          </div>
          <div className="candidate-card__stage">
            <Badge tone={candidateStageTone(candidate.stage)}>{candidateStageLabel(candidate.stage)}</Badge>
          </div>
        </div>

        <div className="detail-grid">
          <Detail label="Email" value={candidate.email} />
          <Detail label="Phone" value={candidate.phone || '—'} />
          <Detail label="Job" value={candidate.job?.title || '—'} />
          <Detail label="Source" value={candidateSourceLabel(candidate.source)} />
          <Detail label="Applied on" value={formatDate(candidate.appliedAt)} />
          <Detail label="Status" value={candidate.isActive ? 'Active' : 'Inactive'} />
        </div>

        {canManage && (
          <div className="candidate-card__move">
            <label className="form-label mb-1" htmlFor="candidate-stage">
              Move to stage
            </label>
            <div className="d-flex gap-2 align-items-center">
              <select
                id="candidate-stage"
                className="form-select form-select-sm"
                value={candidate.stage}
                onChange={(event) => updateStage(event.target.value)}
              >
                {CANDIDATE_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              {candidate.resumeUrl && (
                <a
                  className="btn btn-outline-secondary btn-sm text-nowrap"
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Resume
                </a>
              )}
            </div>
          </div>
        )}

        {candidate.notes && (
          <div className="detail-section">
            <h3>Notes</h3>
            <p className="candidate-card__notes">{candidate.notes}</p>
          </div>
        )}
      </section>

      <CandidateFormModal
        open={modal.open}
        initial={modal.initial}
        meta={meta}
        saving={false}
        onClose={() => setModal({ open: false, initial: null })}
        onSubmit={async (payload, candidateId) => {
          try {
            await candidateApi.update(candidateId, payload);
            toast.success('Candidate updated');
            setModal({ open: false, initial: null });
            load();
          } catch (err) {
            toast.error(err.message || 'Could not update the candidate');
          }
        }}
      />
    </div>
  );
}