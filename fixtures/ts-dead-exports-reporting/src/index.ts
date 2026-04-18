import { buildFindingList } from './report/build-finding-list.js';

export const renderedFindings = buildFindingList([
  { name: 'deep import from feature code', severity: 'medium' },
  { name: 'cycle across billing and account', severity: 'high' }
]);
