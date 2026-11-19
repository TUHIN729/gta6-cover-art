// Wires the page: layouts, per-panel photos/crop/grade, lettering, export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, LAYOUTS, SIZES, STYLES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();
const images = {}; // key -> HTMLImageElement
let panelIndex = 0;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (const key of ['pier', 'boulevard']) {
    if (!images[key]) images[key] = await loadImage(`samples/${key}.jpg`);
  }
}

function redraw() {
  drawCover(canvas, state, images);
}

function chipRow(el, entries, current, onPick) {
  el.innerHTML = '';
  for (const [key, label] of entries) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    if (key === current) b.classList.add('active');
    b.addEventListener('click', () => onPick(key));
    el.appendChild(b);
  }
}

function syncPanelUI() {
  const p = state.panels[panelIndex];
  document.getElementById('panelLabel').textContent = String(panelIndex + 1);
  document.getElementById('panelSrc').value = p.kind === 'art' ? 'art' : p.src;
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('panX').value = p.ox;
  document.getElementById('panY').value = p.oy;
  document.getElementById('grade').value = p.grade;
  chipRow(document.getElementById('panelRow'),
    state.panels.map((_, i) => [`p${i}`, `Panel ${i + 1}`]),
    `p${panelIndex}`, (k) => { panelIndex = Number(k.slice(1)); syncPanelUI(); });
}

function syncAllUI() {
  chipRow(document.getElementById('layoutRow'),
    Object.entries(LAYOUTS).map(([k, v]) => [k, v.name]),
    state.layout, (k) => { state.layout = k; syncAllUI(); redraw(); });
  chipRow(document.getElementById('sizeRow'),
    Object.entries(SIZES).map(([k, v]) => [k, v.label]),
    state.size, (k) => { state.size = k; syncAllUI(); redraw(); });
  document.getElementById('caption').value = state.caption;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('style').value = state.style;
  syncPanelUI();
}

function bindUpload(inputId, key) {
  document.getElementById(inputId).addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    images[key] = await loadImage(URL.createObjectURL(file));
    state.panels[panelIndex].kind = 'photo';
    state.panels[panelIndex].src = key;
    syncPanelUI(); redraw();
    status.textContent = `Loaded ${file.name} into panel ${panelIndex + 1}.`;
  });
}

bindUpload('upA', 'upA');
bindUpload('upB', 'upB');

document.getElementById('fillOne').addEventListener('click', () => {
  const src = images.upA ? 'upA' : 'pier';
  state.panels.forEach((p) => { p.kind = 'photo'; p.src = src; p.zoom = 1; p.ox = 0; p.oy = 0; });
  syncPanelUI(); redraw();
  status.textContent = 'All panels filled with one photo — crop each panel separately.';
});
document.getElementById('demoMix').addEventListener('click', async () => {
  await loadSamples();
  state.panels[0] = { ...state.panels[0], kind: 'photo', src: 'pier' };
  state.panels[1] = { ...state.panels[1], kind: 'photo', src: 'boulevard' };
  state.panels[2] = { ...state.panels[2], kind: 'art', src: null, art: 2 };
  syncPanelUI(); redraw();
});

document.getElementById('panelSrc').addEventListener('change', (e) => {
  const v = e.target.value;
  const p = state.panels[panelIndex];
  if (v === 'art') { p.kind = 'art'; p.src = null; }
  else if (images[v]) { p.kind = 'photo'; p.src = v; }
  else { status.textContent = 'Upload that photo first (Photo A / B above).'; return; }
  redraw();
});
for (const [id, key] of [['zoom', 'zoom'], ['panX', 'ox'], ['panY', 'oy'], ['grade', 'grade']]) {
  document.getElementById(id).addEventListener('input', (e) => {
    state.panels[panelIndex][key] = Number(e.target.value);
    redraw();
  });
}
document.getElementById('caption').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
document.getElementById('style').addEventListener('change', (e) => { state.style = e.target.value; redraw(); });

document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage, images, state, redraw, syncAllUI, canvas, status,
  });
} else {
  loadSamples().then(() => { syncAllUI(); redraw(); });
}
