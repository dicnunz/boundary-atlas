import { mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'output', 'playwright', 'capture');
const VIDEO_ROOT = path.join(OUTPUT_ROOT, 'video');
const DOCS_ASSETS = path.join(REPO_ROOT, 'docs', 'assets');
const WEB_DIST_INDEX = path.join(REPO_ROOT, 'apps', 'web', 'dist', 'index.html');
const APP_URL = 'http://127.0.0.1:4176';

function ensureBuildArtifacts(): void {
  if (existsSync(WEB_DIST_INDEX)) {
    return;
  }

  execFileSync('npm', ['run', 'build'], {
    cwd: REPO_ROOT,
    stdio: 'inherit'
  });
}

function startPreviewServer(): ChildProcess {
  return spawn('npm', ['run', 'preview', '-w', '@boundary-atlas/web', '--', '--host', '127.0.0.1', '--port', '4176'], {
    cwd: REPO_ROOT,
    stdio: 'pipe'
  });
}

async function waitForServer(url: string): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 20_000) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Wait for the preview server.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Preview server did not become ready at ${url}`);
}

function stopServer(server: ChildProcess): void {
  if (server.killed) {
    return;
  }

  server.kill('SIGTERM');
}

ensureBuildArtifacts();
await mkdir(VIDEO_ROOT, { recursive: true });
await mkdir(DOCS_ASSETS, { recursive: true });

const previewServer = startPreviewServer();

try {
  await waitForServer(APP_URL);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_ROOT, size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();

  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /TypeScript and JavaScript repos/i }).waitFor();
  await page.locator('.finding-card').waitFor();
  await page.screenshot({
    path: path.join(DOCS_ASSETS, 'app-home.png')
  });

  await page.locator('.granularity-toggle button', { hasText: 'folder' }).click();
  await page.getByRole('button', { name: /Cross-feature fan-out from src\/features\/reporting/i }).click();
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(DOCS_ASSETS, 'app-detail.png')
  });

  await context.close();
  await browser.close();
} finally {
  stopServer(previewServer);
}

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
