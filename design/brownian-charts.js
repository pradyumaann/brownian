/* Brownian — data-drawing helpers. One classic script; assigns window.Brownian. No network, no framework.
   Every function draws into an <svg> you provide and reads colours from the Brownian CSS tokens, so a
   theme switch or a token edit restyles the chart. Data in, marks out: nothing here invents values. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function tip(node, v, l) {
    node.setAttribute('data-tip-v', v); node.setAttribute('data-tip-l', l); node.setAttribute('tabindex', '0');
    return node;
  }
  function text(parent, x, y, str, cls, anchor) {
    var t = el('text', { x: x, y: y, 'class': cls || 'bw-tick', 'text-anchor': anchor || 'start' }, parent);
    t.textContent = str;
    return t;
  }

  /* Seeded RNG for sample data only (mulberry32). Real screens pass real data. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Colour ramps. name: 'spec' (7 stops) | 'tide' (5 stops). t in [0,1]. */
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function ramp(name, t) {
    var n = name === 'tide' ? 5 : 7, stops = [];
    for (var i = 0; i < n; i++) stops.push(hex(css(name + '-' + i) || '#888888'));
    t = Math.max(0, Math.min(1, t)) * (n - 1);
    var i0 = Math.floor(t), i1 = Math.min(n - 1, i0 + 1), f = t - i0;
    var c = stops[i0].map(function (v, k) { return Math.round(v + (stops[i1][k] - v) * f); });
    return 'rgb(' + c.join(',') + ')';
  }

  /* Number formatting. INR uses Indian grouping; signs use a true minus. */
  var fmt = {
    inr: function (v, dp) { return '₹' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: dp || 0, minimumFractionDigits: dp || 0 }).replace(/^/, v < 0 ? '−' : ''); },
    crore: function (v) { return (v < 0 ? '−' : '') + '₹' + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }) + ' cr'; },
    usd: function (v, dp) { return (v < 0 ? '−' : '') + '$' + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: dp || 0, minimumFractionDigits: dp || 0 }); },
    pct: function (v, dp) { var d = dp == null ? 2 : dp; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(d) + '%'; },
    signed: function (v, dp) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: dp || 0 }); }
  };

  function clear(svg, w, h) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w); svg.setAttribute('height', h);
  }

  /* ---------------------------------------------------------------- Sparkline
     opts: { values:number[], width, height, baseline?:number (default first value) } */
  function spark(svg, o) {
    var w = o.width || 160, h = o.height || 40, v = o.values, pad = 2;
    clear(svg, w, h);
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), span = hi - lo || 1;
    var X = function (i) { return pad + i * (w - pad * 2) / (v.length - 1); };
    var Y = function (y) { return h - pad - (y - lo) / span * (h - pad * 2); };
    var base = o.baseline == null ? v[0] : o.baseline;
    el('line', { x1: 0, x2: w, y1: Y(base), y2: Y(base), 'class': 'bw-base' }, svg);
    var d = v.map(function (y, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(y).toFixed(1); }).join('');
    var up = v[v.length - 1] >= base;
    el('path', { d: d, 'class': 'bw-spark ' + (up ? 'is-gain' : 'is-loss') }, svg);
    el('circle', { cx: X(v.length - 1), cy: Y(v[v.length - 1]), r: 2.5, 'class': 'bw-now' }, svg);
  }

  /* ---------------------------------------------------------------- Ridgeline
     opts: { rows:[{label, values:number[], note?}], width, height, overlap (0..3, default 1.6),
             mode:'spectrum'|'contour', xTicks?:[{at:0..1,label}], focus?:index }
     Row values share ONE y-scale (the max across all rows) so ridges are comparable. */
  function ridgeline(svg, o) {
    var w = o.width || 640, h = o.height || 360, rows = o.rows, n = rows.length;
    var left = o.labelWidth || 112, right = 16, top = 28, bottom = 40;
    clear(svg, w, h);
    var step = (h - top - bottom) / (n + (o.overlap || 1.6) - 1);
    var amp = step * (o.overlap || 1.6);
    var max = 0;
    rows.forEach(function (r) { r.values.forEach(function (v) { if (v > max) max = v; }); });
    var defs = el('defs', {}, svg);
    (o.xTicks || []).forEach(function (t) {
      var x = left + t.at * (w - left - right);
      el('line', { x1: x, x2: x, y1: top - 8, y2: h - bottom + 4, 'class': 'bw-grid' }, svg);
      text(svg, x, h - 12, t.label, 'bw-tick', t.at === 0 ? 'start' : t.at === 1 ? 'end' : 'middle');
    });
    rows.forEach(function (r, i) {
      var base = top + amp + i * step, m = r.values.length;
      var X = function (k) { return left + k * (w - left - right) / (m - 1); };
      var Y = function (v) { return base - v / max * amp; };
      var line = r.values.map(function (v, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      var area = line + 'L' + X(m - 1) + ' ' + base + 'L' + X(0) + ' ' + base + 'Z';
      var dim = o.focus != null && o.focus !== i;
      var fill;
      if (o.mode === 'spectrum') {
        var id = 'bw-rg-' + Math.random().toString(36).slice(2, 8);
        var g = el('linearGradient', { id: id, x1: 0, y1: base, x2: 0, y2: base - amp, gradientUnits: 'userSpaceOnUse' }, defs);
        [0, 0.25, 0.5, 0.75, 1].forEach(function (s) { el('stop', { offset: s, 'stop-color': ramp('spec', s * 0.95 + 0.05) }, g); });
        fill = 'url(#' + id + ')';
      } else fill = css('plot');
      el('path', { d: area, fill: fill, 'class': 'bw-ridge-fill' + (dim ? ' is-dim' : '') }, svg);
      var ln = el('path', { d: line, 'class': 'bw-ridge-line' + (o.focus === i ? ' is-focus' : '') + (dim ? ' is-dim' : '') }, svg);
      if (r.tip) tip(ln, r.tip, r.label);
      text(svg, left - 12, base - 2, r.label, dim ? 'bw-label is-muted' : 'bw-label', 'end');
      if (r.note) text(svg, left - 12, base + 10, r.note, 'bw-tick', 'end');
    });
  }

  /* ---------------------------------------------------------------- Strand Flow
     A Sankey whose bands are made of UNIT STRANDS: one hairline per `unit` of money.
     Band width is exactly proportional to value; strands are counted, never decorative.
     opts: { columns:[[{id,label}]], links:[{source,target,value,color?}], unit, width, height,
             format(v)->string, colorBy:'source'|'target', seed } */
  function strands(svg, o) {
    var w = o.width || 720, h = o.height || 380, padT = 24, padB = 24, gap = o.gap || 14;
    var labelW = o.labelWidth || 120, nodeW = 2;
    clear(svg, w, h);
    var nodes = {}, cols = o.columns;
    cols.forEach(function (col, ci) { col.forEach(function (n, k) { nodes[n.id] = { n: n, col: ci, k: k, inV: 0, outV: 0, cat: n.cat }; }); });
    o.links.forEach(function (l) { nodes[l.source].outV += l.value; nodes[l.target].inV += l.value; });
    var colTotals = cols.map(function (col) { return col.reduce(function (s, n) { var d = nodes[n.id]; return s + Math.max(d.inV, d.outV); }, 0); });
    var maxTotal = Math.max.apply(null, colTotals);
    var maxCount = Math.max.apply(null, cols.map(function (c) { return c.length; }));
    var scale = (h - padT - padB - gap * (maxCount - 1)) / maxTotal; // px per unit of money
    var colX = cols.map(function (_, ci) { return labelW + ci * (w - labelW * 2) / (cols.length - 1); });
    cols.forEach(function (col, ci) {
      var used = col.reduce(function (s, n) { var d = nodes[n.id]; return s + Math.max(d.inV, d.outV) * scale; }, 0) + gap * (col.length - 1);
      var y = padT + (h - padT - padB - used) / 2;
      col.forEach(function (n, k) {
        var d = nodes[n.id]; d.x = colX[ci]; d.y = y; d.h = Math.max(d.inV, d.outV) * scale; d.inY = y; d.outY = y;
        if (!d.cat) d.cat = 'cat-' + ((k % 6) + 1);
        y += d.h + gap;
      });
    });
    var r = rng(o.seed || 7), gStr = el('g', { 'class': 'bw-strands' }, svg);
    o.links.forEach(function (l) {
      var s = nodes[l.source], t = nodes[l.target], bw = l.value * scale;
      var count = Math.max(1, Math.round(l.value / o.unit));
      var color = l.color || css(o.colorBy === 'target' ? t.cat : s.cat);
      var x0 = s.x + nodeW, x1 = t.x, mx = (x0 + x1) / 2;
      var g = el('g', { 'data-link': l.source + '>' + l.target, style: '--d:' + (o.links.indexOf(l) * 0.07).toFixed(2) + 's' }, gStr);
      tip(g, (o.format || String)(l.value), s.n.label + ' \u2192 ' + t.n.label);
      for (var i = 0; i < count; i++) {
        var f = (i + 0.5) / count, y0 = s.outY + f * bw, y1 = t.inY + f * bw;
        var j = (r() - 0.5) * Math.min(18, bw * 0.6); // mid-curve drift only; endpoints stay exact
        el('path', { d: 'M' + x0 + ' ' + y0.toFixed(2) + 'C' + (mx + j).toFixed(1) + ' ' + y0.toFixed(2) + ' ' + (mx - j).toFixed(1) + ' ' + y1.toFixed(2) + ' ' + x1 + ' ' + y1.toFixed(2), stroke: color, pathLength: 1, 'class': 'bw-strand' }, g);
      }
      s.outY += bw; t.inY += bw;
    });
    Object.keys(nodes).forEach(function (id) {
      var d = nodes[id], last = d.col === cols.length - 1, first = d.col === 0;
      el('rect', { x: d.x, y: d.y, width: nodeW, height: Math.max(1, d.h), 'class': 'bw-node' }, svg);
      var tx = last ? d.x + 10 : first ? d.x - 10 : d.x + 10, anchor = first ? 'end' : 'start';
      var cy = d.y + d.h / 2;
      text(svg, tx, cy - 1, d.n.label, 'bw-label', anchor);
      text(svg, tx, cy + 11, (o.format || String)(Math.max(d.inV, d.outV)), 'bw-tick', anchor);
    });
  }

  /* ---------------------------------------------------------------- Field (isometric wireframe surface)
     For surfaces that are REALLY three-dimensional: an implied-volatility surface (strike × expiry → IV),
     a yield surface. opts: { z:number[][] (rows = y axis, cols = x axis), width, height,
     xLabel, yLabel, zLabel, xTicks:[label per col or null], yTicks:[label per row or null], format(z) } */
  function field(svg, o) {
    var w = o.width || 560, h = o.height || 360, Z = o.z, ny = Z.length, nx = Z[0].length;
    clear(svg, w, h);
    var lo = Infinity, hi = -Infinity;
    Z.forEach(function (row) { row.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); }); });
    // project at unit scale, then fit the whole surface (floor + peaks) inside the plot with room for labels
    var raw = function (i, j, v) { return [(i - j) * 0.95, (i + j) * 0.42 - (v - lo) / (hi - lo || 1) * (nx + ny) * 0.32]; };
    var bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    [[0, 0], [nx - 1, 0], [0, ny - 1], [nx - 1, ny - 1]].forEach(function (c) { [lo, hi].forEach(function (v) { var p = raw(c[0], c[1], v); bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); by0 = Math.min(by0, p[1]); by1 = Math.max(by1, p[1]); }); });
    Z.forEach(function (row, jj) { row.forEach(function (v, ii) { var p = raw(ii, jj, v); by0 = Math.min(by0, p[1]); }); });
    var padL = 56, padR = 72, padT = 40, padB = 44;
    var k = Math.min((w - padL - padR) / (bx1 - bx0), (h - padT - padB) / (by1 - by0));
    var ox = padL + ((w - padL - padR) - (bx1 - bx0) * k) / 2 - bx0 * k, oy = padT - by0 * k;
    var P = function (i, j, v) { var p = raw(i, j, v); return [ox + p[0] * k, oy + p[1] * k]; };
    // floor grid
    for (var i = 0; i < nx; i += Math.max(1, Math.round(nx / 8))) { var a = P(i, 0, lo), b = P(i, ny - 1, lo); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'bw-grid' }, svg); }
    for (var j = 0; j < ny; j += Math.max(1, Math.round(ny / 6))) { var c = P(0, j, lo), d = P(nx - 1, j, lo); el('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1], 'class': 'bw-grid' }, svg); }
    // surface: draw rows back to front, coloured by their own mean
    for (j = ny - 1; j >= 0; j--) {
      var pts = Z[j].map(function (v, i) { return P(i, j, v); });
      var mean = Z[j].reduce(function (s, v) { return s + v; }, 0) / nx;
      for (i = 0; i < nx - 1; i++) {
        var t = ((Z[j][i] + Z[j][i + 1]) / 2 - lo) / (hi - lo || 1);
        el('line', { x1: pts[i][0], y1: pts[i][1], x2: pts[i + 1][0], y2: pts[i + 1][1], stroke: ramp('spec', 0.15 + t * 0.85), 'class': 'bw-wire' }, svg);
      }
    }
    for (i = 0; i < nx; i++) {
      var col = Z.map(function (row, jj) { return P(i, jj, row[i]); });
      el('path', { d: col.map(function (p, k) { return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''), 'class': 'bw-wire-x' }, svg);
    }
    (o.xTicks || []).forEach(function (lab, i) { if (lab == null) return; var p = P(i, 0, lo); text(svg, p[0] - 4, p[1] + 16, lab, 'bw-tick', 'end'); });
    (o.yTicks || []).forEach(function (lab, j) { if (lab == null) return; var p = P(nx - 1, j, lo); text(svg, p[0] + 8, p[1] + 12, lab, 'bw-tick', 'start'); });
    if (o.xLabel) { var px = P(nx / 2, 0, lo); text(svg, px[0] - 24, px[1] + 34, o.xLabel, 'bw-axis', 'end'); }
    if (o.yLabel) { var py = P(nx - 1, ny / 2, lo); text(svg, py[0] + 30, py[1] + 30, o.yLabel, 'bw-axis', 'start'); }
    // peak callout
    var pk = [0, 0]; Z.forEach(function (row, jj) { row.forEach(function (v, ii) { if (v === hi) pk = [ii, jj]; }); });
    var pp = P(pk[0], pk[1], hi);
    el('line', { x1: pp[0], y1: pp[1], x2: pp[0], y2: Math.max(14, pp[1] - 22), 'class': 'bw-leader' }, svg);
    tip(el('circle', { cx: pp[0], cy: pp[1], r: 2.5, 'class': 'bw-now' }, svg), (o.format || String)(hi), 'Highest ' + (o.zLabel || 'value'));
    text(svg, pp[0] + 6, Math.max(14, pp[1] - 22) + 4, (o.zLabel || 'max') + ' ' + (o.format || String)(hi), 'bw-label', 'start');
  }

  /* ---------------------------------------------------------------- Fringe (drawdown curtain)
     The running peak is the top edge; from it hangs one hairline per period, as long as the drawdown
     that period. Depth is exact on a linear axis; colour deepens with depth.
     opts: { values:number[] (equity curve), width, height, dates?:[{at:index,label}] } */
  function fringe(svg, o) {
    var w = o.width || 640, h = o.height || 260, v = o.values, n = v.length;
    var left = 44, right = 12, top = 20, bottom = 26;
    clear(svg, w, h);
    var peak = -Infinity, dd = v.map(function (x) { peak = Math.max(peak, x); return (x - peak) / peak; });
    var worst = Math.min.apply(null, dd), floor = Math.min(-0.05, Math.floor(worst * 20) / 20);
    var X = function (i) { return left + i * (w - left - right) / (n - 1); };
    var Y = function (d) { return top + d / floor * (h - top - bottom); };
    for (var q = 0; q >= floor - 1e-9; q -= 0.05) {
      el('line', { x1: left, x2: w - right, y1: Y(q), y2: Y(q), 'class': q === 0 ? 'bw-base' : 'bw-grid' }, svg);
      text(svg, left - 8, Y(q) + 3, q === 0 ? '0%' : '−' + Math.round(-q * 100) + '%', 'bw-tick', 'end');
    }
    dd.forEach(function (d, i) {
      if (d > -0.0005) return;
      el('line', { x1: X(i), x2: X(i), y1: Y(0), y2: Y(d), stroke: ramp('spec', 0.35 + (d / floor) * 0.6), 'class': 'bw-fringe' }, svg);
    });
    var wi = dd.indexOf(worst);
    tip(el('circle', { cx: X(wi), cy: Y(worst), r: 2.5, 'class': 'bw-now' }, svg), fmt.pct(worst * 100, 1), 'Largest fall from a peak');
    text(svg, X(wi) + 8, Y(worst) + 4, 'max drawdown ' + fmt.pct(worst * 100, 1), 'bw-label', 'start');
    (o.dates || []).forEach(function (d) { text(svg, X(d.at), h - 8, d.label, 'bw-tick', 'middle'); });
  }

  /* Plus-mark crosshairs at a fixed pitch — the board's grid ornament. Use sparingly: corners of a
     section, never a field. opts: { points:[[x,y]] } */
  function crosshairs(svg, pts) {
    pts.forEach(function (p) {
      el('path', { d: 'M' + (p[0] - 4) + ' ' + p[1] + 'H' + (p[0] + 4) + 'M' + p[0] + ' ' + (p[1] - 4) + 'V' + (p[1] + 4), 'class': 'bw-plus' }, svg);
    });
  }


  /* Glow and gradients (the "Hyper Charts" look). Each chart gets its own ids so several can share a page.
     Glow only ever sits on marks that already encode a value; it never stands alone as decoration. */
  var uidN = 0;
  function uid(p) { uidN += 1; return (p || 'bw') + '-' + uidN + '-' + Math.random().toString(36).slice(2, 6); }
  function glow(svg, sd) {
    var id = uid('glow'), d = svg.querySelector('defs') || el('defs', {}, svg);
    var f = el('filter', { id: id, x: '-60%', y: '-200%', width: '220%', height: '500%' }, d);
    el('feGaussianBlur', { 'in': 'SourceGraphic', stdDeviation: sd || 3.2, result: 'b' }, f);
    var m = el('feMerge', {}, f); el('feMergeNode', { 'in': 'b' }, m); el('feMergeNode', { 'in': 'SourceGraphic' }, m);
    return 'url(#' + id + ')';
  }
  function grad(svg, stops, x2, y2, units) {
    var id = uid('grad'), d = svg.querySelector('defs') || el('defs', {}, svg);
    var g = el('linearGradient', { id: id, x1: 0, y1: 0, x2: x2 == null ? 1 : x2, y2: y2 || 0, gradientUnits: units }, d);
    stops.forEach(function (s) { el('stop', { offset: s[0], style: 'stop-color:' + s[1] + ';stop-opacity:' + (s[2] == null ? 1 : s[2]) }, g); });
    return 'url(#' + id + ')';
  }

  /* ---------------------------------------------------------------- Diverge (signed bars from a zero line)
     The plain workhorse for "how much did each thing move": sectors, indices, flows. Drawn as glowing pills that
     brighten from the zero line out to their value, over a faint full-width track.
     opts: { rows:[{label, value:number|null, to?:number, src?:'S1'|..., note?}], width, rowH (default 30),
             format(v)->string, labelWidth, domain? (symmetric max; default = max |value|) }
     null values render as "n/a" with no bar — never estimated. Where sources disagree, `to` is the other
     end of the reported range: the bar runs to `value`, a faint extension runs on to `to`, and both are printed. */
  function diverge(svg, o) {
    var rows = o.rows, w = o.width || 560, rh = o.rowH || 30, lw = o.labelWidth || 120, vw = o.valueWidth || 92, bh = Math.min(12, Math.round(rh * 0.36));
    var h = rows.length * rh + 26;
    clear(svg, w, h);
    var probe = text(svg, 0, -10, '', 'bw-label'), need = 0;
    rows.forEach(function (r) { probe.textContent = r.label; need = Math.max(need, probe.getComputedTextLength ? probe.getComputedTextLength() : r.label.length * 6.2); });
    svg.removeChild(probe);
    lw = Math.min(Math.max(lw, need + 18), Math.round(w * 0.42));
    var max = o.domain || Math.max.apply(null, rows.map(function (r) { return r.value == null ? 0 : Math.max(Math.abs(r.value), r.to == null ? 0 : Math.abs(r.to)); })) || 1;
    var x0 = lw + (w - lw - vw) / 2, half = (w - lw - vw) / 2 - 6;
    var gl = glow(svg, 3);
    var gGain = grad(svg, [[0, 'var(--plot-gain)', 0.08], [0.6, 'var(--plot-gain)', 0.55], [1, 'var(--plot-gain)', 1]]);
    var gLoss = grad(svg, [[0, 'var(--plot-loss)', 1], [0.4, 'var(--plot-loss)', 0.55], [1, 'var(--plot-loss)', 0.08]]);
    rows.forEach(function (r, i) {
      var y = 10 + i * rh + rh / 2;
      el('rect', { x: lw, y: y - bh / 2, width: w - vw - lw, height: bh, rx: bh / 2, 'class': 'bw-track' }, svg);
    });
    el('line', { x1: x0, x2: x0, y1: 4, y2: h - 20, 'class': 'bw-base' }, svg);
    text(svg, x0, h - 4, '0', 'bw-tick', 'middle');
    rows.forEach(function (r, i) {
      var y = 10 + i * rh + rh / 2;
      text(svg, lw - 12, y + 4, r.label, 'bw-label', 'end');
      if (r.value == null) { text(svg, w - 8, y + 4, 'n/a', 'bw-tick', 'end'); return; }
      var len = Math.abs(r.value) / max * half, up = r.value >= 0;
      var F = o.format || function (v) { return fmt.pct(v); }, f = F(r.value);
      if (r.to != null && (r.to >= 0) === up && Math.abs(r.to) > Math.abs(r.value)) {
        var len2 = Math.abs(r.to) / max * half;
        el('rect', { x: up ? x0 + len - bh / 2 : x0 - len2, y: y - bh / 2, width: len2 - len + bh / 2, height: bh, rx: bh / 2, 'class': 'bw-bar is-range ' + (up ? 'is-gain' : 'is-loss') }, svg);
        f = f + ' to ' + F(r.to);
      }
      var bar = el('rect', { x: up ? x0 : x0 - len, y: y - bh / 2, width: Math.max(bh, len), height: bh, rx: bh / 2, fill: up ? gGain : gLoss, filter: gl, 'class': 'bw-bar is-lit ' + (up ? 'is-gain' : 'is-loss') }, svg);
      el('circle', { cx: up ? x0 + Math.max(bh, len) - bh / 2 : x0 - Math.max(bh, len) + bh / 2, cy: y, r: bh / 2 - 1.5, 'class': 'bw-core' }, svg);
      tip(bar, f, r.label + (r.src ? ' [' + r.src + ']' : ''));
      text(svg, w - 8, y + 4, (up ? '▲ ' : '▼ ') + f, 'bw-val ' + (up ? 'is-gain' : 'is-loss'), 'end');
    });
  }

  /* ---------------------------------------------------------------- Dial (Mood Index)
     A 180° gauge of 50 segments. Segments light up from 0 to the score, each in the `spec` colour of its own
     position (violet at 0 → gold at 100), so the lit length and colour both encode the score; the rest stay dark.
     Band edges are longer ticks with the band names outside the ring; the score is a dawn needle; each component
     is a dot on an inner track at its own score. The band WORD names the reading, not the colour alone.
     opts: { score, bands:[{from,to,name}], components:[{name, score}], width, height } */
  function dial(svg, o) {
    var w = o.width || 520, h = o.height || Math.round(w * 0.62), cx = w / 2, cy = h - 30, R = Math.min(w / 2 - 40, h - 64);
    clear(svg, w, h);
    var A = function (v) { return Math.PI * (1 - v / 100); };
    var pt = function (v, r) { return [cx + Math.cos(A(v)) * r, cy - Math.sin(A(v)) * r]; };
    var gl = glow(svg, 4), segs = 50, thick = Math.max(10, R * 0.11), r0 = R - thick, gap = 0.9;
    for (var i = 0; i < segs; i++) {
      var a0 = i * 100 / segs + gap / 2, a1 = (i + 1) * 100 / segs - gap / 2, lit = (i + 0.5) * 100 / segs <= o.score;
      var p1 = pt(a0, R), p2 = pt(a1, R), p3 = pt(a1, r0), p4 = pt(a0, r0);
      el('path', { d: 'M' + p1.join(' ') + 'A' + R + ' ' + R + ' 0 0 1 ' + p2.join(' ') + 'L' + p3.join(' ') + 'A' + r0 + ' ' + r0 + ' 0 0 0 ' + p4.join(' ') + 'Z',
        fill: lit ? ramp('spec', 0.2 + 0.8 * (i + 0.5) / segs) : css('plot-grid'), filter: lit ? gl : null, style: '--i:' + i, 'class': lit ? 'bw-seg is-lit' : 'bw-seg' }, svg);
    }
    o.bands.forEach(function (b) {
      if (b.from > 0) { var a = pt(b.from, R + 4), c = pt(b.from, r0 - 6); el('line', { x1: a[0], y1: a[1], x2: c[0], y2: c[1], 'class': 'bw-tickline is-edge' }, svg); }
      var mid = (b.from + Math.min(100, b.to)) / 2, p = pt(mid, R + 16);
      text(svg, p[0], p[1] + 3, b.name, 'bw-band' + (o.score >= b.from && o.score < b.to ? ' is-on' : ''), mid < 40 ? 'end' : mid > 60 ? 'start' : 'middle');
    });
    [0, 50, 100].forEach(function (v) { var p = pt(v, r0 - 14); text(svg, p[0], p[1] + 3, String(v), 'bw-tick', v < 50 ? 'start' : v > 50 ? 'end' : 'middle'); });
    var trackR = r0 * 0.62;
    el('path', { d: 'M' + pt(0, trackR).join(' ') + 'A' + trackR + ' ' + trackR + ' 0 0 1 ' + pt(100, trackR).join(' '), 'class': 'bw-grid' }, svg);
    (o.components || []).forEach(function (c) {
      var p = pt(c.score, trackR);
      tip(el('circle', { cx: p[0], cy: p[1], r: 4, 'class': 'bw-comp' }, svg), c.score.toFixed(0), c.name);
    });
    var n = pt(o.score, r0 - 4);
    el('line', { x1: cx, y1: cy, x2: n[0], y2: n[1], 'class': 'bw-needle', filter: gl }, svg);
    el('circle', { cx: cx, cy: cy, r: 5, 'class': 'bw-now', filter: gl }, svg);
  }

  /* Redraw on container resize so every chart fits its column (400px phones included, no sideways scroll). */
  function fit(container, draw) {
    var last = 0, run = function () { var wd = Math.floor(container.clientWidth); if (wd && wd !== last) { last = wd; draw(wd); } };
    run();
    if (window.ResizeObserver) new ResizeObserver(run).observe(container); else window.addEventListener('resize', run);
  }

  /* Shared readout: one tooltip for every [data-tip-v] mark, on hover, tap and keyboard focus. Call once per page. */
  function readout() {
    if (document.querySelector('.bw-readout')) return;
    var box = document.createElement('div'), b = document.createElement('b'), l = document.createElement('span');
    box.className = 'bw-readout'; box.hidden = true; box.appendChild(b); box.appendChild(l); document.body.appendChild(box);
    function show(t, x, y) {
      b.textContent = t.getAttribute('data-tip-v'); l.textContent = t.getAttribute('data-tip-l') || '';
      box.hidden = false;
      var bw = box.offsetWidth, bh = box.offsetHeight;
      box.style.left = Math.max(8, Math.min(window.innerWidth - bw - 8, x - bw / 2)) + 'px';
      box.style.top = Math.max(8, y - bh - 12) + 'px';
    }
    function at(e) { return e.target.closest ? e.target.closest('[data-tip-v]') : null; }
    document.addEventListener('pointerover', function (e) { var t = at(e); if (t) show(t, e.clientX, e.clientY); });
    document.addEventListener('pointermove', function (e) { var t = at(e); if (t) show(t, e.clientX, e.clientY); else box.hidden = true; });
    document.addEventListener('focusin', function (e) { var t = at(e); if (!t) { box.hidden = true; return; } var r = t.getBoundingClientRect(); show(t, r.left + r.width / 2, r.top); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.hidden = true; });
  }

  var api = { glow: glow, grad: grad, css: css, rng: rng, ramp: ramp, fmt: fmt, spark: spark, ridgeline: ridgeline, strands: strands, field: field, fringe: fringe, diverge: diverge, dial: dial, fit: fit, tip: tip, readout: readout, crosshairs: crosshairs };
  // Classic <script> on reference pages; CommonJS module in the Next.js app (nothing touches the DOM at load).
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.Brownian = api;
})();
