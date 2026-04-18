import { submitOrder } from '../features/checkout/index.js';
import { buildDailyBrief } from '../features/reporting/index.js';

export const opsPortalSnapshot = {
  order: submitOrder('acct-001', 320),
  brief: buildDailyBrief()
};
