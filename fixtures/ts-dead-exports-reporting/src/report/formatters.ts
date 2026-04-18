export function formatFinding(name: string, severity: 'low' | 'medium' | 'high') {
  return `${severity.toUpperCase()}: ${name}`;
}

export function formatSeverityLabel(severity: 'low' | 'medium' | 'high') {
  return `Severity=${severity}`;
}

export function formatLegacyRiskCallout(name: string) {
  return `Legacy review required for ${name}`;
}

export const obsoleteMarkdownPreamble = '> Confidence score pending';
