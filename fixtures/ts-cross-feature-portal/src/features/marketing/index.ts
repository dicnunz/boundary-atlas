export function getCampaignVariant(accountId: string) {
  return accountId.startsWith('acct-') ? 'winback-a' : 'holdout';
}
