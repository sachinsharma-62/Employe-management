import {
  Check,
  Download,
  FileText,
  Pencil,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import Avatar from '../Avatar';
import { EmptyState } from '../employees/profile/ui';
import {
  documentStatusLabel,
  documentStatusTone,
  documentTypeLabel,
  documentTypeTone,
  documentVerificationLabel,
  documentVerificationTone,
  formatDate,
  formatFileSize,
} from '../../utils/constants';

const toneClass = (tone) => `badge-soft badge-soft--${tone}`;

export default function DocumentTable({
  records,
  loading,
  busy,
  showEmployee,
  canReview,
  canEdit,
  onDownload,
  onPreview,
  onVerify,
  onEdit,
  onDelete,
}) {
  if (!loading && records.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents found"
        hint="Upload a document or adjust the filters to see results."
      />
    );
  }

  return (
    <div className="table-responsive">
      <table className="table app-table align-middle mb-0 doc-table">
        <thead>
          <tr>
            {showEmployee && <th>Employee</th>}
            <th>Document</th>
            <th>Type</th>
            <th>Upload date</th>
            <th>Expiry</th>
            <th>Status</th>
            <th>Verification</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody className={loading ? 'is-loading' : ''}>
          {records.map((record) => {
            const employee = record.employee;
            const employeeName = employee
              ? `${employee.firstName} ${employee.lastName}`
              : '—';
            const expired = record.effectiveStatus === 'EXPIRED';
            return (
              <tr key={record._id}>
                {showEmployee && (
                  <td>
                    <div className="doc-table__employee">
                      {employee ? <Avatar user={employee} size={34} /> : <span className="doc-table__avatar-fallback" />}
                      <div>
                        <strong>{employeeName}</strong>
                        <small>{employee?.employeeId || '—'}</small>
                      </div>
                    </div>
                  </td>
                )}
                <td>
                  <button
                    type="button"
                    className="doc-table__name"
                    onClick={() => onPreview(record)}
                    disabled={!record.downloadUrl && !record.fileUrl}
                  >
                    <span className="doc-table__icon">
                      <FileText size={16} />
                    </span>
                    <span>
                      <strong>{record.title}</strong>
                      <small>
                        {record.fileName} · {formatFileSize(record.size)}
                      </small>
                    </span>
                  </button>
                </td>
                <td>
                  <span className={toneClass(documentTypeTone(record.documentType))}>
                    {documentTypeLabel(record.documentType)}
                  </span>
                </td>
                <td>{formatDate(record.uploadedAt || record.createdAt)}</td>
                <td className={expired ? 'text-danger fw-semibold' : ''}>
                  {record.expiryDate ? formatDate(record.expiryDate) : 'No expiry'}
                </td>
                <td>
                  <span className={toneClass(documentStatusTone(record.effectiveStatus))}>
                    {documentStatusLabel(record.effectiveStatus)}
                  </span>
                </td>
                <td>
                  <span className={toneClass(documentVerificationTone(record.verificationStatus))}>
                    {documentVerificationLabel(record.verificationStatus)}
                  </span>
                  {record.verificationStatus === 'REJECTED' && record.rejectionReason && (
                    <small className="doc-table__reason d-block">{record.rejectionReason}</small>
                  )}
                </td>
                <td>
                  <div className="doc-table__actions">
                    <button
                      type="button"
                      className="btn btn-light btn-sm"
                      title="Download"
                      disabled={busy === `download-${record._id}`}
                      onClick={() => onDownload(record)}
                    >
                      <Download size={15} />
                    </button>
                    {canReview && (
                      <button
                        type="button"
                        className="btn btn-light btn-sm"
                        title="Verify"
                        disabled={busy === `verify-${record._id}`}
                        onClick={() => onVerify(record)}
                      >
                        {record.verificationStatus === 'VERIFIED' ? (
                          <Check size={15} className="text-success" />
                        ) : (
                          <ShieldCheck size={15} />
                        )}
                      </button>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          title="Edit"
                          onClick={() => onEdit(record)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-light btn-sm text-danger"
                          title="Delete"
                          disabled={busy === `remove-${record._id}`}
                          onClick={() => onDelete(record)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
