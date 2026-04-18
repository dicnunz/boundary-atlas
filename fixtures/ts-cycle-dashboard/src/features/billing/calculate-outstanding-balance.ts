import { findAccountProfile } from '../account/index.js';

const balances: Record<'starter' | 'growth', number> = {
  starter: 40,
  growth: 120
};

export function calculateOutstandingBalance(accountId: string) {
  const profile = findAccountProfile(accountId);
  return balances[profile.plan];
}
