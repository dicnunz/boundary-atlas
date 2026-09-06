import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BoundaryAtlasReport } from './report-types.js';
import { parseReport, validateReport } from './validate-report.js';

const demo = JSON.parse(readFileSync(new URL('../public/demo-report.json', import.meta.url), 'utf8')) as BoundaryAtlasReport;

describe('local report validation', () => {
  it.each(['ts-cycle-dashboard', 'js-deep-import-storefront', 'ts-dead-exports-reporting', 'ts-cross-feature-portal'])('accepts the committed %s report', (name) => {
    const text = readFileSync(new URL(`../../../docs/samples/fixtures/${name}/report.json`, import.meta.url), 'utf8');
    expect(parseReport(text).ok).toBe(true);
  });

  it('accepts the committed git comparison and preserves extra analyzer fields', () => {
    const text = readFileSync(new URL('../../../docs/samples/self-diff/report.json', import.meta.url), 'utf8');
    const result = parseReport(text);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.report).toEqual(JSON.parse(text));
  });

  it.each(['', '{"kind":', 'undefined', '{"version":"1",}'])('recovers from invalid JSON %j', (text) => {
    expect(parseReport(text)).toMatchObject({ ok: false, message: 'This file is not valid JSON.' });
  });

  it.each([null, [], 'report', 42, {}])('rejects a non-report value %j without throwing', (value) => {
    expect(validateReport(value).ok).toBe(false);
  });

  it('reports exact nested paths and caps error output', () => {
    const value = structuredClone(demo);
    value.graphs.file.nodes[0]!.fanIn = -1;
    value.graphs.file.edges[0]!.specifiers = [false as unknown as string];
    const result = validateReport(value);
    expect(result).toMatchObject({ ok: false, issues: [
      'report.graphs.file.nodes[0].fanIn: expected a non-negative whole number',
      'report.graphs.file.edges[0].specifiers[0]: expected text'
    ] });
    const empty = validateReport({});
    if (!empty.ok) expect(empty.issues.length).toBeLessThanOrEqual(8);
  });

  it('rejects unsupported versions, invalid enums and non-finite numbers', () => {
    expect(validateReport({ ...demo, version: '2' })).toMatchObject({ ok: false, issues: ['report.version: expected "1"'] });
    const value = structuredClone(demo);
    value.findings[0]!.severity = 'critical' as 'high';
    value.graphs.file.nodes[0]!.fanOut = Infinity;
    expect(validateReport(value).ok).toBe(false);
  });

  it('rejects dangling graph endpoints before the force engine sees them', () => {
    const value = structuredClone(demo);
    value.graphs.file.edges[0]!.target = 'file:missing.ts';
    expect(validateReport(value)).toMatchObject({ ok: false, issues: [
      'report.graphs.file.edges[0].target: node "file:missing.ts" is missing from the file graph'
    ] });
  });

  it('rejects duplicate node, edge, and finding IDs', () => {
    const value = structuredClone(demo);
    value.graphs.file.nodes.push(value.graphs.file.nodes[0]!);
    value.graphs.file.edges.push(value.graphs.file.edges[0]!);
    value.findings.push(value.findings[0]!);
    const result = validateReport(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toHaveLength(3);
  });

  it('rejects missing finding, hotspot, and dead-export references', () => {
    const value = structuredClone(demo);
    value.findings[0]!.nodeIds = ['file:missing.ts'];
    value.hotspots[0]!.nodeId = 'file:missing.ts';
    value.deadExports[0]!.sourceNodeId = 'file:missing.ts';
    const result = validateReport(value);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toHaveLength(3);
  });

  it('requires comparison details for diff reports', () => {
    expect(validateReport({ ...demo, kind: 'diff' })).toMatchObject({ ok: false, issues: ['report.drift: diff reports require comparison details'] });
  });

  it('does not mutate a valid report', () => {
    const before = JSON.stringify(demo);
    const result = validateReport(demo);
    expect(result.ok && result.report === demo).toBe(true);
    expect(JSON.stringify(demo)).toBe(before);
  });
});
