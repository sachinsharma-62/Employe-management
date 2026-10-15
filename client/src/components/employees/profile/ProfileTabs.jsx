export default function ProfileTabs({ tabs, active, onChange }) {
  return (
    <div className="profile-tabs" role="tablist">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          className={`profile-tabs__tab ${active === id ? 'is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={15} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
