import { mkdir, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'output', 'playwright', 'capture');
const VIDEO_ROOT = path.join(OUTPUT_ROOT, 'video');
const DOCS_ASSETS = path.join(REPO_ROOT, 'docs', 'assets');
const APP_URL = 'http://127.0.0.1:4176';

await mkdir(VIDEO_ROOT, { recursive: true });
await mkdir(DOCS_ASSETS, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO_ROOT, size: { width: 1440, height: 900 } }
});
const page = await context.newPage();

await page.goto(APP_URL, { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: /architecture radar/i }).waitFor();
await page.screenshot({
  path: path.join(DOCS_ASSETS, 'app-home.png'),
  fullPage: true
});

await page.locator('.granularity-toggle button', { hasText: 'file' }).click();
await page.getByRole('button', { name: /file hotspot: packages\/core\/src\/analyze\/analyze-repository\.ts/i }).click();
await page.waitForTimeout(800);
await page.screenshot({
  path: path.join(DOCS_ASSETS, 'app-detail.png'),
  fullPage: true
});

await context.close();
await browser.close();

const videoFile = (await readdir(VIDEO_ROOT)).find((entry) => entry.endsWith('.webm'));
if (!videoFile) {
  throw new Error('No Playwright video was produced.');
}

execFileSync('ffmpeg', [
  '-y',
  '-i',
  path.join(VIDEO_ROOT, videoFile),
  '-vf',
  'fps=12,scale=1120:-1:flags=lanczos',
  '-loop',
  '0',
  path.join(DOCS_ASSETS, 'demo.gif')
]);

console.log('captured docs/assets/app-home.png');
console.log('captured docs/assets/app-detail.png');
console.log('captured docs/assets/demo.gif');
