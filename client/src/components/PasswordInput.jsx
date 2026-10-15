import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
  invalid = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        className={`form-control ${invalid ? 'is-invalid' : ''}`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
