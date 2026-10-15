import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = 'lg',
  footer,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="app-modal" role="dialog" aria-modal="true">
      <div className="app-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className={`app-modal__dialog app-modal__dialog--${size}`}>
        <header className="app-modal__header">
          <div className="app-modal__heading">
            {Icon && (
              <span className="app-modal__heading-icon">
                <Icon size={18} />
              </span>
            )}
            <div>
              <h3>{title}</h3>
              {subtitle && <small>{subtitle}</small>}
            </div>
          </div>
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="app-modal__body">{children}</div>

        {footer && <footer className="app-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
