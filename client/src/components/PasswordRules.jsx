import { Check, X } from 'lucide-react';

export const passwordChecks = (password = '') => [
  { key: 'length', label: '8-64 characters', passed: password.length >= 8 && password.length <= 64 },
  { key: 'lower', label: 'One lowercase letter', passed: /[a-z]/.test(password) },
  { key: 'upper', label: 'One uppercase letter', passed: /[A-Z]/.test(password) },
  { key: 'number', label: 'One number', passed: /\d/.test(password) },
];

export default function PasswordRules({ password }) {
  const checks = passwordChecks(password);
  const allPassed = checks.every((c) => c.passed);

  return (
    <ul className={`password-rules ${allPassed ? 'password-rules--ok' : ''}`}>
      {checks.map((c) => (
        <li key={c.key} className={c.passed ? 'passed' : ''}>
          {c.passed ? <Check size={13} /> : <X size={13} />}
          {c.label}
        </li>
      ))}
    </ul>
  );
}
