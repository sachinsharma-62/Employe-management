import env from '../config/env.js';

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  const base = env.serverUrl.replace(/\/$/, '');
  return `${base}${path}`;
};
