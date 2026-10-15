export default function StatusBadge({ tone = 'default', children, icon: Icon }) {
  return (
    <span className={`hub-badge hub-badge--${tone}`}>
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
}
