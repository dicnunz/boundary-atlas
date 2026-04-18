import { calculateOutstandingBalance } from '../billing/index.js';
import { findAccountProfile } from './profile-store.js';

export function loadAccountSummary(accountId: string) {
  const profile = findAccountProfile(accountId);

  return {
    accountId,
    team: profile.team,
    outstandingBalance: calculateOutstandingBalance(accountId)
  };
}
