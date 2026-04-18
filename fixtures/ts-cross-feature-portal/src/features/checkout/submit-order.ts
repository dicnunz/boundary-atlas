import { getSignedInUser } from '../auth/index.js';
import { recordRevenueAttribution } from '../finance/index.js';
import { getCampaignVariant } from '../marketing/index.js';
import { openEscalationTicket } from '../support/index.js';

export function submitOrder(accountId: string, amount: number) {
  const user = getSignedInUser(accountId);
  const campaign = getCampaignVariant(accountId);
  const financeEntry = recordRevenueAttribution(accountId, amount);
  const supportTicket =
    amount > 250 ? openEscalationTicket(accountId, 'manual-review') : 'no-ticket';

  return {
    accountId,
    campaign,
    financeEntry,
    supportTicket,
    plan: user.plan
  };
}
