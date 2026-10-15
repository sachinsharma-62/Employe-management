export default function DashboardPanel({
  title,
  hint,
  icon: Icon,
  actions,
  className = '',
  bodyClassName = '',
  children,
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <div className="panel__header">
          <h3>
            {Icon && <Icon size={17} className="me-2" />}
            {title}
          </h3>
          {actions || (hint && <span className="panel__hint">{hint}</span>)}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
