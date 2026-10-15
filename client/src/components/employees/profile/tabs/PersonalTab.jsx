import { Detail } from '../ui';
import { formatDate, genderLabel } from '../../../../utils/constants';

export default function PersonalTab({ employee }) {
  return (
    <div className="panel">
      <div className="panel__header">
        <h3>Personal Information</h3>
        <span className="panel__hint">{employee.email}</span>
      </div>

      <section className="form-section">
        <h4 className="form-section__title">Basic details</h4>
        <div className="detail-grid">
          <Detail label="Full name" value={employee.fullName} />
          <Detail label="Gender" value={genderLabel(employee.gender)} />
          <Detail label="Date of birth" value={formatDate(employee.dateOfBirth)} />
          <Detail label="Blood group" value={employee.bloodGroup} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Contact</h4>
        <div className="detail-grid">
          <Detail label="Work email" value={employee.email} />
          <Detail label="Personal email" value={employee.personalEmail} />
          <Detail label="Phone" value={employee.phone} />
          <Detail label="Alternate phone" value={employee.alternatePhone} />
          <Detail label="Address" value={employee.address} />
          <Detail label="City" value={employee.city} />
          <Detail label="State" value={employee.state} />
          <Detail label="Country" value={employee.country} />
          <Detail label="Pincode" value={employee.pincode} />
        </div>
      </section>

      <section className="form-section">
        <h4 className="form-section__title">Emergency contact</h4>
        <div className="detail-grid">
          <Detail label="Contact name" value={employee.emergencyContact?.name} />
          <Detail label="Relationship" value={employee.emergencyContact?.relationship} />
          <Detail label="Phone" value={employee.emergencyContact?.phone} />
          <Detail label="Email" value={employee.emergencyContact?.email} />
          <Detail label="Address" value={employee.emergencyContact?.address} />
        </div>
      </section>
    </div>
  );
}
