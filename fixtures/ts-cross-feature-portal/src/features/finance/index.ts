export function recordRevenueAttribution(accountId: string, amount: number) {
  return `${accountId}:${amount}:finance-booked`;
}
