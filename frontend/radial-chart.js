/**
 * RadialProgressChart — Apple Fitness-style concentric SVG rings
 * Pure JS, no dependencies. Fully reusable across dashboard.
 *
 * Usage:
 *   const chart = new RadialProgressChart(element, {
 *     values: [0.85, 0.4],          // 0-1 per ring (outer→inner)
 *     colors: [['#14b8a6','#0ea5e9'], ['#fb7185','#f43f5e']],
 *     labels: ['Pass', 'Fail'],
 *     centerValue: '85%',
 *     centerLabel: 'Pass Rate',
 *   });
 *   chart.update({ values: [...], centerValue: '90%' }); // smooth re-render
 *   chart.destroy();
 */
class RadialProgressChart {
  constructor(container, config) {
    this.el = typeof container === 'string'
      ? document.getElementById(container) : container;
    this.cfg = { size: 240, strokeWidth: 12, gap: 20, ...config };
    this._rafs = [];
    this._uid = `rpc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    this._render();
  }

  // ── Public API ─────────────────────────────────
  update(patch) {
    this.cfg = { ...this.cfg, ...patch };
    this.destroy(false);
    this._render();
  }
  destroy(clearEl = true) {
    this._rafs.forEach(id => cancelAnimationFrame(id));
    this._rafs = [];
    if (clearEl && this.el) this.el.innerHTML = '';
  }

  // ── Internals ──────────────────────────────────
  _easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  _animateRing(el, circ, targetOffset, delay) {
    const duration = 1300;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts + delay;
      if (ts < start) { this._rafs.push(requestAnimationFrame(tick)); return; }
      const p = this._easeOut(Math.min((ts - start) / duration, 1));
      el.setAttribute('stroke-dashoffset', circ + (targetOffset - circ) * p);
      if (p < 1) this._rafs.push(requestAnimationFrame(tick));
    };
    this._rafs.push(requestAnimationFrame(tick));
  }

  _svgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  _render() {
    const { values, colors, labels, centerValue, centerLabel, size, strokeWidth, gap } = this.cfg;
    const cx = size / 2, cy = size / 2;
    const outerR = cx - strokeWidth / 2 - 8;

    // ── Wrapper ──
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;width:100%;';

    // ── SVG ──
    const svg = this._svgEl('svg', { viewBox: `0 0 ${size} ${size}` });
    svg.style.cssText = 'width:100%;max-width:260px;height:auto;overflow:visible;';

    // ── Defs: gradients + glow filter ──
    const defs = this._svgEl('defs');

    // Glow filter
    const filterId = `${this._uid}_glow`;
    const filt = this._svgEl('filter', { id: filterId, x: '-30%', y: '-30%', width: '160%', height: '160%' });
    filt.innerHTML = `
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>`;
    defs.appendChild(filt);

    // Per-ring linear gradients (top-left → bottom-right over the SVG canvas)
    const gradIds = (colors || []).map((c, i) => {
      const id = `${this._uid}_g${i}`;
      const pair = Array.isArray(c) ? c : [c, c];
      const grad = this._svgEl('linearGradient', {
        id, gradientUnits: 'userSpaceOnUse',
        x1: 0, y1: 0, x2: size, y2: size,
      });
      const s1 = this._svgEl('stop', { offset: '0%', 'stop-color': pair[0] });
      const s2 = this._svgEl('stop', { offset: '100%', 'stop-color': pair[1] || pair[0] });
      grad.appendChild(s1); grad.appendChild(s2);
      defs.appendChild(grad);
      return id;
    });

    svg.appendChild(defs);

    // ── Rings ──
    (values || []).forEach((val, i) => {
      const r = outerR - i * gap;
      if (r < 10) return;
      const circ = 2 * Math.PI * r;
      const pct  = Math.max(0, Math.min(1, val || 0));
      const targetOffset = circ * (1 - pct);
      const colorStr = gradIds[i] ? `url(#${gradIds[i]})` : '#6366f1';

      // Track (dim background ring)
      svg.appendChild(this._svgEl('circle', {
        cx, cy, r, fill: 'none',
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': strokeWidth,
      }));

      // Progress arc
      const arc = this._svgEl('circle', {
        cx, cy, r, fill: 'none',
        stroke: colorStr,
        'stroke-width': strokeWidth,
        'stroke-linecap': 'round',
        'stroke-dasharray': circ,
        'stroke-dashoffset': circ, // start empty → animate to target
        transform: `rotate(-90 ${cx} ${cy})`,
        filter: `url(#${filterId})`,
      });
      svg.appendChild(arc);

      // Animated fill
      this._animateRing(arc, circ, targetOffset, i * 200);
    });

    wrap.appendChild(svg);

    // ── Center text overlay ──
    if (centerValue !== undefined) {
      const center = document.createElement('div');
      center.style.cssText = `
        position:absolute; top:50%; left:50%;
        transform:translate(-50%, -56%);
        text-align:center; pointer-events:none;
        width:80px;
      `;
      center.innerHTML = `
        <div style="font-family:'Inter','Segoe UI',sans-serif;font-size:1.4rem;
          font-weight:800;color:#f1f5f9;line-height:1;letter-spacing:-0.03em;">
          ${centerValue}
        </div>
        <div style="font-size:0.65rem;color:#64748b;font-weight:600;
          text-transform:uppercase;letter-spacing:0.07em;margin-top:4px;">
          ${centerLabel || ''}
        </div>`;
      wrap.appendChild(center);
    }

    // ── Legend ──
    if (labels && labels.length) {
      const leg = document.createElement('div');
      leg.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin-top:14px;';
      labels.forEach((lbl, i) => {
        const c = Array.isArray(colors[i]) ? colors[i][0] : (colors[i] || '#6366f1');
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:5px;';
        item.innerHTML = `
          <span style="width:8px;height:8px;border-radius:50%;background:${c};
            box-shadow:0 0 6px ${c}88;flex-shrink:0;display:inline-block;"></span>
          <span style="font-size:0.7rem;color:#64748b;font-weight:600;
            font-family:'Inter','Segoe UI',sans-serif;">${lbl}</span>`;
        leg.appendChild(item);
      });
      wrap.appendChild(leg);
    }

    this.el.innerHTML = '';
    this.el.appendChild(wrap);
  }
}

// Global registry so app.js can destroy/replace charts
window._radialCharts = window._radialCharts || {};
