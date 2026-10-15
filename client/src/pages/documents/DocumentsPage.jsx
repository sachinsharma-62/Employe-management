import { useState } from 'react';
import { FilePlus2, FileText } from 'lucide-react';
import useDocuments from '../../hooks/useDocuments';
import DocumentFilters from '../../components/documents/DocumentFilters';
import DocumentStats from '../../components/documents/DocumentStats';
import DocumentTable from '../../components/documents/DocumentTable';
import DocumentUploadModal from '../../components/documents/DocumentUploadModal';
import DocumentEditModal from '../../components/documents/DocumentEditModal';
import DocumentVerifyModal from '../../components/documents/DocumentVerifyModal';

export default function DocumentsPage() {
  const docs = useDocuments();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [verifyRecord, setVerifyRecord] = useState(null);

  const handleDelete = (record) => {
    if (window.confirm(`Delete "${record.title}"? This cannot be undone.`)) {
      docs.remove(record._id);
    }
  };

  return (
    <div className="hub stack-lg doc-page">
      <header className="hub__pagehead">
        <span className="hub__pagehead-icon">
          <FileText size={18} />
        </span>
        <div>
          <h1>Documents</h1>
          <p>
            {docs.canView
              ? 'View, download and verify employee documents'
              : 'Upload and manage your personal documents'}
          </p>
        </div>
        <div className="ms-auto d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setUploadOpen(true)}
          >
            <FilePlus2 size={15} className="me-1" /> Upload document
          </button>
        </div>
      </header>

      {docs.error && (
        <div className="alert alert-danger py-2 mb-0" role="alert">
          {docs.error}
        </div>
      )}

      {docs.canView && docs.stats && <DocumentStats stats={docs.stats} />}

      <div className="panel">
        <div className="panel__header">
          <h3>
            <FileText size={17} className="me-2" />
            {docs.canView ? 'All documents' : 'My documents'}
          </h3>
          <span className="text-muted small">
            {docs.pagination
              ? `${docs.pagination.total} document${docs.pagination.total === 1 ? '' : 's'}`
              : `${docs.records.length} document${docs.records.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {docs.canView && (
          <DocumentFilters
            filters={docs.filters}
            employees={docs.employees}
            onFilter={docs.setFilter}
            onReset={docs.resetFilters}
          />
        )}

        <DocumentTable
          records={docs.records}
          loading={docs.loading}
          busy={docs.busy}
          showEmployee={docs.canView}
          canReview={docs.canManage}
          canEdit={docs.canManage || !docs.canView}
          onDownload={docs.download}
          onPreview={docs.download}
          onVerify={setVerifyRecord}
          onEdit={setEditRecord}
          onDelete={handleDelete}
        />

        {docs.canView && docs.pagination && docs.pagination.pages > 1 && (
          <div className="doc-pagination">
            <button
              type="button"
              className="btn btn-light btn-sm"
              disabled={docs.page <= 1}
              onClick={() => docs.setPage(docs.page - 1)}
            >
              Previous
            </button>
            <span>
              Page {docs.pagination.page} of {docs.pagination.pages}
            </span>
            <button
              type="button"
              className="btn btn-light btn-sm"
              disabled={docs.page >= docs.pagination.pages}
              onClick={() => docs.setPage(docs.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <DocumentUploadModal
        open={uploadOpen}
        employees={docs.canView ? docs.employees : null}
        saving={docs.busy === 'upload'}
        onClose={() => setUploadOpen(false)}
        onSubmit={async (formData) => {
          const ok = await docs.upload(formData);
          if (ok) setUploadOpen(false);
        }}
      />

      <DocumentEditModal
        open={Boolean(editRecord)}
        record={editRecord}
        saving={docs.busy === `update-${editRecord?._id}`}
        onClose={() => setEditRecord(null)}
        onSubmit={async (payload) => {
          const ok = await docs.update(editRecord._id, payload);
          if (ok) setEditRecord(null);
        }}
      />

      <DocumentVerifyModal
        open={Boolean(verifyRecord)}
        record={verifyRecord}
        saving={docs.busy === `verify-${verifyRecord?._id}`}
        onClose={() => setVerifyRecord(null)}
        onSubmit={async (payload) => {
          const ok = await docs.verify(verifyRecord._id, payload);
          if (ok) setVerifyRecord(null);
        }}
      />
    </div>
  );
}
