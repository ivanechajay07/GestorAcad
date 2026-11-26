import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Captura las pantallas principales para revisión visual.
 * Requiere Node 22+ (WebSocket global) y Chrome/Chromium instalado.
 *
 * Uso:
 *   node scripts/visual-capture.mjs
 *   BASE_URL=http://localhost:3000 node scripts/visual-capture.mjs
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3010';
const OUT = path.resolve(process.env.VISUAL_OUT ?? 'visual-audit');
const USER = process.env.VISUAL_USER ?? 'admin';
const PASSWORD = process.env.VISUAL_PASSWORD ?? 'gestor123';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chromePath = chromeCandidates.find((candidate) => existsSync(candidate));

if (!chromePath) {
  console.error('No se encontró Chrome. Define CHROME_PATH.');
  process.exit(1);
}
if (typeof WebSocket === 'undefined') {
  console.error('Este script requiere Node 22+ con WebSocket global.');
  process.exit(1);
}

await fs.mkdir(OUT, { recursive: true });
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'gestoracad-visual-'));
const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(
  chromePath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--window-size=1440,900',
    '--force-device-scale-factor=1',
    '--no-first-run',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let ws;
let seq = 0;
const pending = new Map();
const errors = [];

const cleanup = async () => {
  try { ws?.close(); } catch { /* ignore */ }
  chrome.kill();
  await fs.rm(profile, { recursive: true, force: true }).catch(() => undefined);
};

try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      ready = true;
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!ready) throw new Error('Chrome no respondió en el puerto de depuración.');

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  ws = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
    }
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result?.value;
  };
  const navigate = async (url, wait = 2400) => {
    await send('Page.navigate', { url });
    await sleep(wait);
  };
  const shot = async (name) => {
    const response = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(path.join(OUT, name), Buffer.from(response.data, 'base64'));
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate(`${BASE}/login`, 1500);

  const logged = await evaluate(`(async () => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: ${JSON.stringify(USER)}, password: ${JSON.stringify(PASSWORD)} }),
    });
    if (!response.ok) return false;
    const data = (await response.json()).data;
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('gestoracad_token', data.token);
    if (data.refreshToken) localStorage.setItem('gestoracad_refresh_token', data.refreshToken);
    localStorage.setItem('gestoracad_user', JSON.stringify({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      fullName: data.user.fullName,
      roles: data.roles,
      permissions: data.permissions,
      department: data.user.department,
      avatar: data.user.avatar,
    }));
    localStorage.setItem('gestoracad_theme', 'light');
    return true;
  })()`);
  if (!logged) throw new Error('No se pudo iniciar sesión para la captura visual.');

  const desktopRoutes = [
    ['dashboard', '/dashboard'],
    ['students', '/students'],
    ['teachers', '/teachers'],
    ['users', '/users'],
    ['roles', '/roles'],
    ['university', '/university'],
    ['academic', '/academic'],
    ['evaluation', '/evaluation'],
    ['audit', '/audit'],
    ['profile', '/profile'],
  ];

  for (const [name, route] of desktopRoutes) {
    await navigate(`${BASE}${route}`);
    await shot(`desktop-${name}.png`);
  }

  await navigate(`${BASE}/students`);
  await evaluate(`[...document.querySelectorAll('button')].find((button) => (button.textContent || '').includes('Registrar Estudiante'))?.click()`);
  await sleep(700);
  await shot('desktop-modal-student.png');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const [name, route] of [['dashboard', '/dashboard'], ['students', '/students'], ['evaluation', '/evaluation']]) {
    await navigate(`${BASE}${route}`);
    await shot(`mobile-${name}.png`);
  }

  await navigate(`${BASE}/dashboard`);
  await evaluate(`document.querySelector('.assistant-fab')?.click()`);
  await sleep(500);
  await shot('mobile-assistant.png');

  console.log(JSON.stringify({ output: OUT, screenshots: desktopRoutes.length + 4, consoleErrors: errors }, null, 2));
  if (errors.length > 0) process.exitCode = 2;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await cleanup();
}
