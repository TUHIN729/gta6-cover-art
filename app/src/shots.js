// Fixed scenes for screenshots: ?shot=editor shows the page with demo photos loaded;
// ?shot=cover shows the cover alone, full-bleed. Query params: layout, size, style,
// caption, subtitle, photo (panel 1 sample), photo2 (panel 2 sample), panel3 (photo|art).
// &check=export writes the PNG data-URL length into #status for verification.
// window.__shotReady is set once painted.
export async function runShot(shot, query, ctx) {
  const { loadImage, images, state, redraw, syncAllUI, canvas, status } = ctx;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.layout = query.get('layout') || 'grid';
  state.size = query.get('size') || 'wide';
  state.style = query.get('style') || 'neon';
  state.caption = query.get('caption') || 'Neon Nights';
  state.subtitle = query.get('subtitle') || 'Sunset · Heat · Vice';
  const p1 = query.get('photo') || 'pier';
  const p2 = query.get('photo2') || 'boulevard';
  const p3 = query.get('panel3') || 'art';
  images.pier = await loadImage(`samples/pier.jpg`);
  images.boulevard = await loadImage(`samples/boulevard.jpg`);
  state.panels[0] = { ...state.panels[0], kind: 'photo', src: p1 };
  state.panels[1] = { ...state.panels[1], kind: 'photo', src: p2 };
  state.panels[2] = p3 === 'art'
    ? { ...state.panels[2], kind: 'art', src: null, art: 2 }
    : { ...state.panels[2], kind: 'photo', src: p3 };
  syncAllUI();
  redraw();
  if (query.get('check') === 'export') {
    const url = canvas.toDataURL('image/png');
    status.textContent = `PNG OK ${url.length} chars, starts ${url.slice(0, 22)}`;
    window.__exportPNGChars = url.length;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
