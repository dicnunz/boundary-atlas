export function openEscalationTicket(accountId: string, reason: string) {
  return `${accountId}:${reason}:support-ticket`;
}
