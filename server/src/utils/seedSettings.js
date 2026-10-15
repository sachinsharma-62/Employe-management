import AppSetting from '../models/AppSetting.js';
import { SETTINGS_KEYS, SETTINGS_DEFAULTS } from './settingsStore.js';

const seedSettings = async () => {
  let created = 0;
  let updated = 0;

  for (const key of SETTINGS_KEYS) {
    const existing = await AppSetting.findOne({ key });
    if (existing) {
      existing.data = { ...SETTINGS_DEFAULTS[key], ...existing.data };
      await existing.save();
      updated += 1;
      continue;
    }
    await AppSetting.create({ key, data: SETTINGS_DEFAULTS[key] });
    created += 1;
  }

  return { created, updated, total: SETTINGS_KEYS.length };
};

export default seedSettings;