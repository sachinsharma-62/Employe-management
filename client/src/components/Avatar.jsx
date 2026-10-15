import { assetUrl, initials } from '../utils/constants';

export default function Avatar({ user, size = 36, className = '' }) {
  const src = assetUrl(user?.avatar);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };

  if (src) {
    return (
      <img
        src={src}
        alt={user?.fullName || 'Avatar'}
        className={`avatar ${className}`}
        style={style}
      />
    );
  }

  return (
    <span className={`avatar avatar--initials ${className}`} style={style}>
      {initials(user)}
    </span>
  );
}
