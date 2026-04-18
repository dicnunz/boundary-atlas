export function getSignedInUser(accountId: string) {
  return {
    accountId,
    plan: 'growth',
    segment: 'trial-rescue'
  };
}
