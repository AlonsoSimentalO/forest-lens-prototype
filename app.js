import { zones, scenarios, metrics, getScenario, findZone } from './data.js';

const paths = {
  tree: '<path d="m12 3-6 9h4l-5 6h6v3h2v-3h6l-5-6h4Z"/>',
  trees: '<path d="m9 3-5 8h3l-4 6h5v4h2v-4h5l-4-6h3Z"/><path d="m16 4 4 7h-3l4 6h-5m0 0v4"/>',
  leaf: '<path d="M20 3C9 2 3 7 5 14c2 7 15 5 15-11Z"/><path d="M4 21 15 10m-5 5v-5m0 5h5"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 1-7.9A6 6 0 0 0 6.3 9 4.5 4.5 0 0 0 7 18Z"/><path d="m10 13 2-2 2 2m-2-2v5"/>',
  coins: '<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v5c0 4 12 4 12 0V6M3 11v5c0 3 6 4 10 2"/><path d="M17 9c5 0 5 6 0 6s-5 6 0 6m0-13v14"/>',
  walk: '<circle cx="14" cy="4" r="2"/><path d="m7 21 4-7m6 7-3-8V8l-3-1-3 5H5m9-4 3 4h3m-9-5-1 7 4 1"/>',
  timber: '<path d="m5 3 9 9m-6 9 8-10m-5-5 4-3 6 6-3 4-7-7Z"/><path d="m3 17 4-4 4 4-4 4Z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  locate: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
  camera: '<path d="M8 6 9 3h6l1 3h4a1 1 0 0 1 1 1v12H3V7a1 1 0 0 1 1-1Z"/><circle cx="12" cy="12" r="4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z"/><path d="M8 9h8m-8 4h5"/>',
  scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M9 12h6m-3-3v6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  person: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  people: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a6 6 0 0 1 3 5v2"/>',
  branch: '<path d="M12 22V8m0 9C3 18 2 13 3 8c6-1 9 4 9 9Zm0-5c8 0 10-5 9-10-6-1-9 4-9 10Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.tree}</svg>`; }
document.querySelectorAll('[data-icon]').forEach(element => { element.innerHTML = icon(element.dataset.icon); });
const $ = id => document.getElementById(id);
let zone = zones[0];
let selectedScenario = null;
let guideOpen = true;
let toastTimer;
let locationRequest = 0;
let detailsOpen = false;
let activeMetric = null;

function setDetails(open) {
  detailsOpen = Boolean(open && selectedScenario);
  $('scenario-results').hidden = !detailsOpen;
  $('toggle-results').setAttribute('aria-expanded', String(detailsOpen));
  document.querySelector('.forest-view').classList.toggle('details-open', detailsOpen);
  if (detailsOpen) {
    $('forest-profile-overlay').open = false;
    activeMetric = null;
    $('scene-insight').hidden = true;
  }
}
function renderScene() {
  const data = selectedScenario ? getScenario(zone.id, selectedScenario) : null;
  document.querySelector('.forest-view').dataset.management = selectedScenario || 'current';
  $('scene-metrics').innerHTML = metrics.map((metric, index) => `<button type="button" class="scene-metric metric-${metric.key}" data-metric="${index}" aria-expanded="${activeMetric === index}" aria-controls="scene-insight"><span class="metric-anchor">${icon(metric.icon)}</span><span class="metric-caption"><span>${metric.label}</span><strong>${data ? `${data.outcomes[index] > 0 ? '↑ Increase' : data.outcomes[index] < 0 ? '↓ Decrease' : '↔ Similar'}` : zone.profile[index]}</strong></span><span class="metric-plus">+</span></button>`).join('');
  $('reset-scenario').hidden = !selectedScenario;
  $('toggle-results').disabled = !selectedScenario;
  $('scenario-caption').textContent = selectedScenario ? 'Actions, benefits & people affected' : 'Explore a priority to see what changes.';
  $('metrics-kicker').textContent = selectedScenario ? 'A POSSIBLE FUTURE' : 'THE FOREST TODAY';
  $('panel-title').textContent = selectedScenario ? scenarios.find(item => item.id === selectedScenario).label + ' first.' : 'A closer look.';
  $('metric-context').textContent = selectedScenario ? 'Compared with current management · illustrative outcomes' : 'Current conditions · illustrative sample data';
  if (activeMetric !== null) showMetric(activeMetric);
}
function showMetric(index) {
  activeMetric = index;
  const metric = metrics[index];
  $('insight-title').textContent = metric.label;
  const definitions = ['Habitat variety and conditions for forest species.', 'Carbon held in the forest, not a carbon price or credit estimate.', 'Illustrative financial return from forest management.', 'Opportunities to visit and enjoy the forest.'];
  if (selectedScenario) {
    const value = getScenario(zone.id, selectedScenario).outcomes[index];
    $('insight-text').textContent = `${value > 0 ? 'Expected to increase' : value < 0 ? 'Expected to decrease' : 'Expected to remain similar'} compared with continuing current management. ${definitions[index]} This is an illustrative zone-level assumption.`;
  } else $('insight-text').textContent = `Current sample profile: ${zone.profile[index].toLowerCase()}. ${definitions[index]} This describes the selected zone, not a detected tree.`;
  $('scene-insight').hidden = false;
  document.querySelectorAll('[data-metric]').forEach(button => button.setAttribute('aria-expanded', String(Number(button.dataset.metric) === index)));
}

function toast(message, duration = 7000) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  if (duration > 0) toastTimer = setTimeout(() => { $('toast').hidden = true; }, duration);
}
function updateGuide() {
  $('guide-text').textContent = selectedScenario ? getScenario(zone.id, selectedScenario).guide : zone.intro;
  $('guide-bubble').hidden = !guideOpen;
  $('guide-toggle').setAttribute('aria-expanded', String(guideOpen));
  $('guide-toggle').setAttribute('aria-label', `${guideOpen ? 'Hide' : 'Show'} forest guide explanation`);
}
function direction(value, withLabel = false) {
  const label = value > 0 ? 'Increase' : value < 0 ? 'Decrease' : 'Similar';
  return `<strong class="direction ${value > 0 ? 'up' : value < 0 ? 'down' : ''}" aria-label="${label}">${value > 0 ? '↑' : value < 0 ? '↓' : '↔'}</strong>${withLabel ? `<span class="direction-label">${label}</span>` : ''}`;
}
function renderScenario() {
  document.querySelectorAll('.scenario-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === selectedScenario)));
  setDetails(detailsOpen);
  if (selectedScenario) {
    const data = getScenario(zone.id, selectedScenario);
    $('selected-label').textContent = scenarios.find(item => item.id === selectedScenario).label;
    $('actions-list').innerHTML = data.actions.map(action => `<li><span class="action-check">${icon('check')}</span>${action}</li>`).join('');
    $('outcomes-grid').innerHTML = metrics.map((metric, index) => `<div class="outcome"><span>${metric.label}</span>${direction(data.outcomes[index], true)}</div>`).join('');
    $('stakeholders-list').innerHTML = data.stakeholders.map(([name, effect, change], index) => `<div class="stakeholder"><span data-icon>${icon(['person', 'people', 'timber'][index])}</span><span class="stakeholder-name">${name}</span><span class="stakeholder-effect">${effect}</span>${direction(change)}</div>`).join('');
  }
  updateGuide();
  renderScene();
}
function renderZone() {
  setDetails(false);
  activeMetric = null;
  $('scene-insight').hidden = true;
  $('zone-select').value = zone.id;
  $('scene-forest-type').textContent = zone.type;
  $('scene-priority').textContent = `Current priority: ${zone.priority}`;
  $('forest-type').textContent = zone.type;
  $('current-priority').textContent = zone.priority;
  $('profile-metrics').innerHTML = metrics.map((metric, index) => `<div class="profile-metric"><span data-icon>${icon(metric.icon)}</span><span>${metric.label}</span><strong class="${zone.profile[index].toLowerCase()}">${zone.profile[index]}</strong></div>`).join('');
  renderScenario();
}
$('zone-select').innerHTML = zones.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
$('scenario-options').innerHTML = scenarios.map(item => `<button class="scenario-button" data-scenario="${item.id}" aria-pressed="false" title="${item.description}"><span class="selection-dot"></span>${icon(item.icon)}<span>${item.label}</span></button>`).join('');
$('scenario-options').addEventListener('click', event => {
  const button = event.target.closest('[data-scenario]');
  if (!button) return;
  selectedScenario = button.dataset.scenario;
  renderScenario();
});
$('zone-select').addEventListener('change', event => {
  locationRequest++;
  $('location-button').disabled = false;
  zone = zones.find(item => item.id === event.target.value);
  selectedScenario = null;
  $('location-status').textContent = 'Sample zone selected manually. All forest data is illustrative.';
  renderZone();
});
$('dismiss-guide').addEventListener('click', () => { guideOpen = false; updateGuide(); });
$('guide-toggle').addEventListener('click', () => { guideOpen = !guideOpen; updateGuide(); });
$('toggle-results').addEventListener('click', () => { setDetails(!detailsOpen); if (detailsOpen) $('close-results').focus(); });
$('close-results').addEventListener('click', () => { setDetails(false); $('toggle-results').focus(); });
$('reset-scenario').addEventListener('click', () => { selectedScenario = null; setDetails(false); renderScenario(); document.querySelector('.scenario-button').focus(); });
$('scene-metrics').addEventListener('click', event => {
  const button = event.target.closest('[data-metric]');
  if (!button) return;
  setDetails(false);
  $('forest-profile-overlay').open = false;
  showMetric(Number(button.dataset.metric));
});
$('close-insight').addEventListener('click', () => {
  const previous = activeMetric;
  activeMetric = null;
  $('scene-insight').hidden = true;
  renderScene();
  document.querySelector(`[data-metric="${previous}"]`)?.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !about.open) {
    if (detailsOpen) { setDetails(false); $('toggle-results').focus(); }
    else if (activeMetric !== null) $('close-insight').click();
  }
});

$('camera-button').addEventListener('click', () => {
  toast('Camera preview: this prototype uses a forest image. No camera access is needed.');
});

$('location-button').addEventListener('click', () => {
  if (!window.isSecureContext || !navigator.geolocation) {
    $('location-status').textContent = 'GPS needs HTTPS or localhost and a supported browser. Choose a sample zone above.'; return;
  }
  const request = ++locationRequest;
  $('location-button').disabled = true;
  $('location-status').textContent = 'Checking whether you are inside a sample forest zone…';
  navigator.geolocation.getCurrentPosition(position => {
    if (request !== locationRequest) return;
    $('location-button').disabled = false;
    const match = findZone(position.coords.latitude, position.coords.longitude);
    if (match) {
      zone = match;
      selectedScenario = null;
      $('location-status').textContent = `GPS matched ${match.name}. Forest data remains illustrative.`;
      renderZone();
    } else {
      $('location-status').textContent = 'You are outside the sample zones. Continue with a zone selected above.';
    }
  }, error => {
    if (request !== locationRequest) return;
    $('location-button').disabled = false;
    $('location-status').textContent = error.code === 1 ? 'Location permission was not granted. Choose a sample zone above.' : error.code === 3 ? 'Location lookup timed out. Try again or choose a sample zone above.' : 'Your location is unavailable. Choose a sample zone above.';
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 0 });
});
const about = $('about-dialog');
$('about-button').addEventListener('click', () => about.showModal());
$('close-about').addEventListener('click', () => about.close());
$('got-it').addEventListener('click', () => about.close());
about.addEventListener('click', event => { if (event.target === about) { const bounds = about.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) about.close(); } });
$('forest-profile-overlay').addEventListener('toggle', () => {
  if ($('forest-profile-overlay').open) {
    setDetails(false);
    activeMetric = null;
    $('scene-insight').hidden = true;
  }
});
renderZone();
