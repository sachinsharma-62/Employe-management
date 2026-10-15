import { Laptop } from 'lucide-react';
import profileApi from '../../../../api/profile.api';
import { assetStatusLabel, assetStatusTone, assetTypeLabel, formatDate } from '../../../../utils/constants';
import { Badge, EmptyState, SectionLoading, StatTile } from '../ui';
import useEmployeeData from '../useEmployeeData';

export default function AssetsTab({ employeeId }) {
  const { data, loading, error } = useEmployeeData(employeeId, profileApi.assets);

  if (loading) return <SectionLoading label="Loading assets..." />;
  if (error) return <div className="alert alert-danger py-2">{error}</div>;

  const records = data?.records || [];
  const summary = data?.summary;

  return (
    <div className="stack-lg">
      {summary && (
        <div className="profile-stat-grid">
          <StatTile label="Total assets" value={summary.total} tone="indigo" icon={Laptop} />
          <StatTile label="Assigned" value={summary.assigned} tone="green" />
          <StatTile label="Returned" value={summary.returned} tone="cyan" />
          <StatTile label="In repair" value={summary.repair} tone="amber" />
        </div>
      )}

      <div className="panel">
        <div className="panel__header">
          <h3>Assigned assets</h3>
          <span className="panel__hint">{records.length} item(s)</span>
        </div>

        {records.length ? (
          <div className="table-responsive">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Serial</th>
                  <th>Condition</th>
                  <th>Assigned</th>
                  <th>Returned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((asset) => (
                  <tr key={asset._id}>
                    <td className="fw-semibold">{asset.name}</td>
                    <td>{assetTypeLabel(asset.type)}</td>
                    <td className="text-muted">{asset.serialNumber || '—'}</td>
                    <td>{asset.condition}</td>
                    <td>{formatDate(asset.assignedDate)}</td>
                    <td>{formatDate(asset.returnedDate)}</td>
                    <td>
                      <Badge tone={assetStatusTone(asset.status)}>
                        {assetStatusLabel(asset.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Laptop} title="No assets assigned" hint="Assigned equipment will appear here." />
        )}
      </div>
    </div>
  );
}
