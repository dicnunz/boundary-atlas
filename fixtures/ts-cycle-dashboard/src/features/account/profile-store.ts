const accounts: Record<string, { plan: 'starter' | 'growth'; team: string }> = {
  'acct-001': { plan: 'growth', team: 'Northwind' },
  'acct-002': { plan: 'starter', team: 'Kepler' }
};

export function findAccountProfile(accountId: string) {
  const profile = accounts[accountId];

  if (!profile) {
    throw new Error(`Unknown account: ${accountId}`);
  }

  return profile;
}
