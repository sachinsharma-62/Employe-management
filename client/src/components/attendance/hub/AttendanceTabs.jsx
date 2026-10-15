export default function AttendanceTabs({ tabs, active, onChange }) {
  return (
    <div className="hub-tabs" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`hub-tab ${active === tab.id ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {Icon && <Icon size={15} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
