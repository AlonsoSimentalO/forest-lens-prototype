// Optional browser smoke test. Uses an installed Chromium browser and native CDP.
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const executable = process.env.BROWSER_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile = await mkdtemp(path.join(tmpdir(), 'forest-lens-browser-'));
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9223', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
browser.on('error', error => { console.error(error.message); process.exitCode = 1; });
let socket;
try {
  let tab;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { const tabs = await (await fetch('http://127.0.0.1:9223/json')).json(); tab = tabs.find(item => item.type === 'page'); if (tab) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!tab) throw new Error('Browser did not expose a debugging page');
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) { const { resolve, reject, timer } = pending.get(message.id); clearTimeout(timer); pending.delete(message.id); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result); }
  });
  function cdp(method, params = {}) { return new Promise((resolve, reject) => { const key = ++id; const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timeout: ${method}`)); }, 15000); pending.set(key, { resolve, reject, timer }); socket.send(JSON.stringify({ id: key, method, params })); }); }
  async function evaluate(expression) { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
  async function until(expression) { for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error(`Condition not met: ${expression}`); }
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "window.cameraRequests = 0; if (navigator.mediaDevices) { navigator.mediaDevices.getUserMedia = async () => { window.cameraRequests++; throw new Error('Camera must not be requested'); }; navigator.mediaDevices.enumerateDevices = async () => { window.cameraRequests++; return []; }; }" });
  await cdp('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await until(`document.querySelectorAll('.scenario-button').length === 4`);
  await until(`document.querySelector('.forest-background').complete && document.querySelector('.forest-background').naturalWidth > 0`);
  assert.equal(await evaluate(`document.getElementById('scenario-results').hidden`), true);
  await evaluate(`document.querySelector('[data-scenario="conservation"]').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('#actions-list li').length`), 3);
  assert.equal(await evaluate(`document.querySelectorAll('.outcome').length`), 4);
  assert.equal(await evaluate(`document.querySelector('[data-scenario="conservation"]').getAttribute('aria-pressed')`), 'true');
  assert.equal(await evaluate(`document.querySelectorAll('.scene-metric').length`), 4);
  assert.equal(await evaluate(`document.querySelector('.metric-biodiversity').textContent.includes('Increase')`), true);
  await evaluate(`document.querySelector('[data-metric="0"]').click()`);
  assert.equal(await evaluate(`document.getElementById('scene-insight').hidden`), false);
  await evaluate(`document.getElementById('close-insight').click(); document.getElementById('toggle-results').click()`);
  assert.equal(await evaluate(`document.getElementById('scenario-results').hidden`), false);
  await evaluate(`document.getElementById('close-results').click()`);
  assert.equal(await evaluate(`document.getElementById('scenario-results').hidden`), true);
  await mkdir('artifacts', { recursive: true });
  // Wait briefly for optional fonts before screenshots, without requiring network access.
  await evaluate(`Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2000))]).then(() => true)`);
  let screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile('artifacts/desktop.png', Buffer.from(screenshot.data, 'base64'));
  await evaluate(`document.getElementById('dismiss-guide').click(); document.querySelector('[data-scenario="carbon"]').click()`);
  assert.equal(await evaluate(`document.getElementById('guide-bubble').hidden`), true);
  await evaluate(`document.getElementById('guide-toggle').click()`);
  assert.equal(await evaluate(`document.getElementById('guide-bubble').hidden`), false);
  for (const zoneId of ['spruce', 'mixed', 'pine']) {
    await evaluate(`document.getElementById('zone-select').value = '${zoneId}'; document.getElementById('zone-select').dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.getElementById('scenario-results').hidden`), true);
    for (const scenarioId of ['commercial', 'conservation', 'recreation', 'carbon']) {
      await evaluate(`document.querySelector('[data-scenario="${scenarioId}"]').click()`);
      assert.equal(await evaluate(`document.querySelectorAll('.stakeholder').length`), 3);
      assert.ok(await evaluate(`document.getElementById('guide-text').textContent.length > 30`));
    }
  }
  await evaluate(`document.getElementById('about-button').click()`);
  assert.equal(await evaluate(`document.getElementById('about-dialog').open`), true);
  await evaluate(`document.getElementById('got-it').click()`);
  assert.equal(await evaluate(`document.getElementById('about-dialog').open`), false);
  await cdp('Browser.setPermission', { permission: { name: 'geolocation' }, setting: 'granted', origin: 'http://127.0.0.1:5173' });
  await cdp('Emulation.setGeolocationOverride', { latitude: 62.015, longitude: 25.56, accuracy: 10 });
  await evaluate(`document.getElementById('location-button').click()`);
  await until(`document.getElementById('location-status').textContent.includes('GPS matched')`);
  assert.equal(await evaluate(`document.getElementById('zone-select').value`), 'spruce');
  await cdp('Emulation.setGeolocationOverride', { latitude: 47.3769, longitude: 8.5417, accuracy: 10 });
  await evaluate(`document.getElementById('location-button').click()`);
  await until(`document.getElementById('location-status').textContent.includes('outside')`);
  await cdp('Browser.setPermission', { permission: { name: 'geolocation' }, setting: 'denied', origin: 'http://127.0.0.1:5173' });
  await evaluate(`document.getElementById('location-button').click()`);
  await until(`document.getElementById('location-status').textContent.includes('not granted')`);
  await evaluate(`document.getElementById('camera-button').click()`);
  assert.equal(await evaluate(`document.getElementById('toast').textContent.includes('No camera access')`), true);
  assert.equal(await evaluate(`window.cameraRequests`), 0);
  assert.equal(await evaluate(`document.querySelector('video') === null && document.getElementById('camera-select') === null`), true);
  await evaluate(`document.getElementById('zone-select').value = 'spruce'; document.getElementById('zone-select').dispatchEvent(new Event('change')); document.querySelector('[data-scenario="conservation"]').click(); document.getElementById('toast').hidden = true`);
  for (const width of [320, 390, 760, 820, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 761 });
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true, `No horizontal overflow at ${width}px`);
    assert.equal(await evaluate(`Array.from(document.querySelectorAll('.profile-metric')).every(el => el.getBoundingClientRect().right <= document.querySelector('.profile-card').getBoundingClientRect().right)`), true, `Profile metrics fit their card at ${width}px`);
    if (width === 390) {
      screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await writeFile('artifacts/mobile.png', Buffer.from(screenshot.data, 'base64'));
      await evaluate(`document.getElementById('toggle-results').click()`);
      assert.equal(await evaluate(`document.getElementById('scenario-results').hidden`), false);
      screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      await writeFile('artifacts/mobile-details.png', Buffer.from(screenshot.data, 'base64'));
      await evaluate(`document.getElementById('close-results').click(); document.getElementById('forest-profile-overlay').open = true`);
      await until(`document.getElementById('forest-profile-overlay').open`);
      assert.equal(await evaluate(`document.querySelector('.profile-card').getBoundingClientRect().width > 0`), true);
      await evaluate(`document.getElementById('forest-profile-overlay').open = false`);
    }
  }
  for (const [width, height] of [[320, 568], [390, 667], [390, 844]]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await evaluate(`document.getElementById('toggle-results').scrollIntoView({ block: 'center' })`);
    assert.equal(await evaluate(`(() => { const button = document.getElementById('toggle-results'); const r = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)); })()`), true, `Trade-offs button is reachable at ${width}x${height}`);
    assert.equal(await evaluate(`document.querySelector('.viewfinder').getBoundingClientRect().bottom <= document.querySelector('.decision-panel').getBoundingClientRect().top`), true, `Forest overlay does not overlap decision card at ${width}x${height}`);
  }
  await evaluate(`document.getElementById('reset-scenario').click(); window.scrollTo(0, 0)`);
  screenshot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  await writeFile('artifacts/mobile-current.png', Buffer.from(screenshot.data, 'base64'));
  assert.deepEqual(exceptions, []);
  console.log('Browser checks passed: all scenarios, scene indicators, details sheet, guide, profile, zone reset, modal, GPS states, camera UI without hardware requests, and 5 responsive widths.');
} finally { socket?.close(); browser.kill(); }
