import { formatCurrency } from '../../shared/ui/index.js';
import { themeTokens } from '../../shared/ui/internal/theme-tokens.js';
import { getCacheRecords } from '../../shared/data/internal/cache-records.js';

export function renderCart() {
  return `${themeTokens.cartAccent} ${formatCurrency(getCacheRecords()[0].total)}`;
}
