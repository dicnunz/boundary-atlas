// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

// Canvas behavior is covered by graph tests and browser e2e; these tests exercise report loading state.
vi.mock('./GraphView.js', () => ({ GraphView: () => null }));

const demo = JSON.parse(readFileSync('apps/web/public/demo-report.json', 'utf8'));
const cycle = JSON.parse(readFileSync('docs/samples/fixtures/ts-cycle-dashboard/report.json', 'utf8'));
let root: Root;
let container: HTMLDivElement;

async function upload(text: string, name = 'report.json') {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File([text], name, { type: 'application/json' });
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(text) });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__ = structuredClone(demo);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  delete window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__;
  vi.unstubAllGlobals();
});

describe('report loading UI', () => {
  it('keeps the current report after a malformed file and accepts a corrected file with the same name', async () => {
    await act(async () => root.render(<App />));
    expect(container.querySelector('h1')?.textContent).toBe(demo.project.label);
    await upload('{invalid');
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('This file is not valid JSON.');
    expect(container.querySelector('h1')?.textContent).toBe(demo.project.label);
    expect(container.querySelector<HTMLInputElement>('input[type="file"]')?.value).toBe('');
    await upload(JSON.stringify(cycle));
    expect(container.querySelector('h1')?.textContent).toBe(cycle.project.label);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toBe('report.json');
  });

  it('never fetches the example when an embedded report is present, including malformed embedded reports', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__ = { version: '2' };
    await act(async () => root.render(<App />));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('not a supported Boundary Atlas v1 report');
    expect(fetch).not.toHaveBeenCalled();
    await upload(JSON.stringify(cycle));
    expect(container.querySelector('h1')?.textContent).toBe(cycle.project.label);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not overwrite an uploaded report when a slower initial example request finishes', async () => {
    delete window.__BOUNDARY_ATLAS_EMBEDDED_REPORT__;
    let resolveExample!: (response: { ok: boolean; text: () => Promise<string> }) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveExample = resolve; })));
    await act(async () => root.render(<App />));
    await upload(JSON.stringify(cycle));
    await act(async () => resolveExample({ ok: true, text: () => Promise.resolve(JSON.stringify(demo)) }));
    expect(container.querySelector('h1')?.textContent).toBe(cycle.project.label);
    expect(container.querySelector('[role="status"]')?.textContent).toBe('report.json');
  });
});
