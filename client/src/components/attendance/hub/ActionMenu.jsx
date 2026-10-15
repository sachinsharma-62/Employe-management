import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export default function ActionMenu({ label = 'More actions', trigger, items = [] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="hub-menu" ref={containerRef}>
      <button
        type="button"
        className="hub-icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger || <MoreVertical size={16} />}
      </button>
      {open && (
        <div className="hub-menu__list" role="menu">
          {items.map((item, idx) => {
            const Icon = item.icon;
            if (item.disabled) {
              return (
                <div
                  key={item.label || idx}
                  className="hub-menu__item is-disabled px-3 py-1.5 text-xs text-muted"
                  style={{ opacity: 0.85, cursor: 'default', fontWeight: 500 }}
                >
                  {Icon && <Icon size={14} className="me-1.5" />}
                  <span>{item.label}</span>
                </div>
              );
            }
            return (
              <button
                key={item.label || idx}
                type="button"
                role="menuitem"
                className={`hub-menu__item ${item.danger ? 'is-danger' : ''}`}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {Icon && <Icon size={14} />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
