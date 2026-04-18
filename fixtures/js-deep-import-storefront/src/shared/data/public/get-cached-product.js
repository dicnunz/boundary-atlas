import { getCacheRecords } from '../internal/cache-records.js';

export function getCachedProduct(id) {
  return getCacheRecords().find((record) => record.id === id);
}
