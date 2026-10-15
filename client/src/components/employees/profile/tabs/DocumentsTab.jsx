import { Download, FileText, Trash2, Upload } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import { useToast } from '../../../../context/ToastContext';
import {
  documentTypeLabel,
  documentTypeTone,
  documentVerificationLabel,
  documentVerificationTone,
  formatDate,
  formatFileSize,
} from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function DocumentsTab({ employeeId, canManage, onRequestUpload }) {
  const toast = useToast();
  const { data, loading, error, reload } = useEmployeeData(employeeId, profileApi.documents);
  const records = data?.records || [];

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      await profileApi.removeDocument(employeeId, doc._id);
      toast.success('Document deleted');
      reload();
    } catch (err) {
      toast.error(err.message || 'Could not delete document');
    }
  };

  if (loading) return <SectionLoading label="Loading documents..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  return (
    <div className="panel">
      <div className="panel__header">
        <h3>
          <FileText size={17} className="me-2" /> Documents
        </h3>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onRequestUpload}>
          <Upload size={15} className="me-1" /> Upload
        </button>
      </div>

      {records.length ? (
        <div className="doc-list">
          {records.map((doc) => {
            const uploader = doc.uploadedBy;
            const uploaderName = uploader
              ? uploader.fullName || `${uploader.firstName} ${uploader.lastName}`
              : 'System';
            return (
              <div className="doc-item" key={doc._id}>
                <span className="doc-item__icon">
                  <FileText size={18} />
                </span>
                <div className="doc-item__body">
                  <strong>{doc.title}</strong>
                  <small>
                    {doc.fileName} · {formatFileSize(doc.size)} · Uploaded {formatDate(doc.createdAt)}{' '}
                    by {uploaderName}
                    {doc.expiryDate ? ` · Expires ${formatDate(doc.expiryDate)}` : ''}
                  </small>
                </div>
                <Badge tone={documentTypeTone(doc.documentType)}>
                  {documentTypeLabel(doc.documentType)}
                </Badge>
                <Badge tone={documentVerificationTone(doc.verificationStatus)}>
                  {documentVerificationLabel(doc.verificationStatus)}
                </Badge>
                <div className="doc-item__actions">
                  <a
                    href={doc.downloadUrl || doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="emp-actions__btn"
                    title="Download"
                  >
                    <Download size={15} />
                  </a>
                  {canManage && (
                    <button
                      type="button"
                      className="emp-actions__btn emp-actions__btn--danger"
                      onClick={() => handleDelete(doc)}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          hint="Upload contracts, IDs, certificates and more."
        />
      )}
    </div>
  );
}
