import { themeTokens } from './theme-tokens.js';

export function buildBadge(status) {
  return `[${themeTokens.badges[status] ?? status}]`;
}
