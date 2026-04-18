import { formatFinding } from './formatters.js';

export function buildFindingList(
  findings: ReadonlyArray<{ name: string; severity: 'low' | 'medium' | 'high' }>
) {
  return findings.map(({ name, severity }) => formatFinding(name, severity));
}
