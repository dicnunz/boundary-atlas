import { submitOrder } from '../checkout/index.js';
import { openEscalationTicket } from '../support/index.js';

export function buildDailyBrief() {
  const syntheticOrder = submitOrder('acct-brief', 180);
  const ticket = openEscalationTicket('acct-brief', 'daily-brief');

  return {
    syntheticOrder,
    ticket
  };
}
