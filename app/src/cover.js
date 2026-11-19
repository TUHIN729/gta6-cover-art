// Vice Cover Studio — draws a multi-panel, GTA-poster-style cover onto a canvas.
// All art is original: photos are the kit's built-in samples or the user's own
// uploads; every gradient, skyline and lettering effect is drawn here in code.
// No Rockstar logo, artwork, character or font is used anywhere.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080 · square' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350 · portrait' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080 · landscape' },
};

export const STYLES = {
  neon: { ribbon: '#ff2e88', ribbon2: '#ff7a18', ink: '#ffffff', accent: '#39e6ff', name: 'Neon Pink' },
  gold: { ribbon: '#ffb400', ribbon2: '#ff5e3a', ink: '#1c1030', accent: '#ffe9a8', name: 'Sunset Gold' },
  teal: { ribbon: '#00c2a8', ribbon2: '#7b2fff', ink: '#ffffff', accent: '#ffd166', name: 'Vice Teal' },
};

export const LAYOUTS = {
  grid: { name: 'Vice Grid', rects: [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]] },
  strip: { name: 'Comic Strip', rects: [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]] },
  duo: { name: 'Sunset Duo', rects: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]] },
};

export function defaultState() {
  return {
    layout: 'grid',
    size: 'wide',
    caption: 'Neon Nights',
    subtitle: 'Sunset · Heat · Vice',
    style: 'neon',
    panels: [
      { kind: 'photo', src: 'pier', zoom: 1, ox: 0, oy: 0, grade: 0.55, art: 0 },
      { kind: 'photo', src: 'boulevard', zoom: 1, ox: 0, oy: 0, grade: 0.55, art: 1 },
      { kind: 'art', src: null, zoom: 1, ox: 0, oy: 0, grade: 0.4, art: 2 },
    ],
  };
}

/** Panel rects in canvas pixels for a layout. */
export function panelRects(layout, w, h) {
  const g = Math.max(6, Math.round(Math.min(w, h) * 0.008)); // white gutter
  return LAYOUTS[layout].rects.map(([fx, fy, fw, fh]) => ({
    x: fx * w + g / 2, y: fy * h + g / 2,
    w: fw * w - g, h: fh * h - g,
  }));
}

function drawArtPanel(ctx, r, art) {
  // Original procedural art: sunset sky, sun disc, skyline blocks, neon grid.
  const sky = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  const palettes = [
    ['#2b1055', '#ff2e88', '#ff7a18', '#ffd166'],
    ['#0b1e3a', '#7b2fff', '#ff2e88', '#39e6ff'],
    ['#12082b', '#ff5e3a', '#ffb400', '#fff3c4'],
  ];
  const p = palettes[art % palettes.length];
  sky.addColorStop(0, p[0]); sky.addColorStop(0.55, p[1]); sky.addColorStop(0.85, p[2]); sky.addColorStop(1, p[3]);
  ctx.fillStyle = sky; ctx.fillRect(r.x, r.y, r.w, r.h);
  // sun
  const sx = r.x + r.w * (0.3 + 0.4 * (art % 2));
  const sy = r.y + r.h * 0.42;
  const sr = Math.min(r.w, r.h) * 0.22;
  const sun = ctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr);
  sun.addColorStop(0, '#fff7d6'); sun.addColorStop(0.6, p[3]); sun.addColorStop(1, 'rgba(255,122,24,0)');
  ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p[3]; ctx.beginPath(); ctx.arc(sx, sy, sr * 0.55, 0, Math.PI * 2); ctx.fill();
  // skyline
  ctx.fillStyle = 'rgba(16,6,32,0.92)';
  let bx = r.x;
  const base = r.y + r.h * 0.78;
  let i = 0;
  while (bx < r.x + r.w) {
    const bw = r.w * (0.09 + 0.05 * ((i * 7 + art) % 4));
    const bh = r.h * (0.12 + 0.09 * ((i * 5 + art * 3) % 5));
    ctx.fillRect(bx, base - bh, bw, bh + r.h * 0.22);
    // lit windows
    ctx.fillStyle = 'rgba(255,209,102,0.85)';
    for (let wy = base - bh + 6; wy < base - 6; wy += 14) {
      if ((i + Math.round(wy)) % 3 === 0) ctx.fillRect(bx + 4, wy, 4, 6);
    }
    ctx.fillStyle = 'rgba(16,6,32,0.92)';
    bx += bw; i++;
  }
  // neon grid floor
  ctx.strokeStyle = 'rgba(57,230,255,0.5)'; ctx.lineWidth = Math.max(1, r.w * 0.002);
  for (let gy = 0; gy < 5; gy++) {
    const y = base + (r.y + r.h - base) * (gy / 4) ** 1.4;
    ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke();
  }
}

function drawPhotoPanel(ctx, r, img, panel) {
  const scale = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight) * panel.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = r.x + r.w / 2 + panel.ox * r.w * 0.4;
  const cy = r.y + r.h / 2 + panel.oy * r.h * 0.4;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
}

function gradePanel(ctx, r, grade) {
  if (grade <= 0) return;
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, `rgba(255,122,24,${0.10 * grade})`);
  g.addColorStop(0.55, `rgba(255,46,136,${0.22 * grade})`);
  g.addColorStop(1, `rgba(43,16,85,${0.45 * grade})`);
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  // vignette
  const v = ctx.createRadialGradient(
    r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.35,
    r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(10,4,24,${0.35 * grade})`);
  ctx.fillStyle = v; ctx.fillRect(r.x, r.y, r.w, r.h);
}

/** Draws the whole cover. `images` maps photo keys ('pier','boulevard','upA','upB') to HTMLImageElements. */
export function drawCover(canvas, state, images) {
  const size = SIZES[state.size] || SIZES.wide;
  canvas.width = size.w; canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const style = STYLES[state.style] || STYLES.neon;

  ctx.fillStyle = '#f5f0ea'; ctx.fillRect(0, 0, w, h); // poster-white gutter base
  const rects = panelRects(state.layout, w, h);
  state.panels.forEach((panel, i) => {
    const r = rects[i];
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    const img = panel.kind === 'photo' ? images[panel.src] : null;
    if (img) drawPhotoPanel(ctx, r, img, panel);
    else drawArtPanel(ctx, r, panel.art ?? i);
    gradePanel(ctx, r, panel.grade ?? 0.5);
    ctx.restore();
    // crisp white frame + thin dark inner line per panel
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(20,8,32,0.55)'; ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
  });

  // ---- caption ribbon across the foot ----
  const caption = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  if (caption) {
    const bandH = h * 0.16;
    const bandY = h - bandH;
    const slant = w * 0.02;
    const grad = ctx.createLinearGradient(0, bandY, w, bandY);
    grad.addColorStop(0, style.ribbon); grad.addColorStop(1, style.ribbon2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(slant, bandY); ctx.lineTo(w - slant, bandY);
    ctx.lineTo(w, bandY + bandH); ctx.lineTo(0, bandY + bandH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, bandY, w, Math.max(2, h * 0.004));

    let sizePx = h * 0.085;
    const fontFor = (s) => `italic 900 ${s}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    ctx.font = fontFor(sizePx);
    try { ctx.letterSpacing = `${Math.round(sizePx * 0.04)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(caption).width > w * 0.88 && sizePx > 14) {
      sizePx -= 2; ctx.font = fontFor(sizePx);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(20,8,32,0.85)'; ctx.lineWidth = Math.max(2, sizePx * 0.09);
    ctx.strokeText(caption, w / 2, bandY + bandH * 0.46);
    ctx.fillStyle = style.ink;
    ctx.fillText(caption, w / 2, bandY + bandH * 0.46);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

    if (subtitle) {
      const subPx = Math.max(12, h * 0.022);
      ctx.font = `700 ${subPx}px "Helvetica Neue", Arial, sans-serif`;
      try { ctx.letterSpacing = `${Math.round(subPx * 0.35)}px`; } catch { /* ignore */ }
      ctx.fillStyle = style.accent;
      ctx.fillText(subtitle, w / 2, bandY + bandH * 0.83);
      try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
    }
  }
  // outer poster frame
  ctx.strokeStyle = '#14081f'; ctx.lineWidth = Math.max(4, w * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
