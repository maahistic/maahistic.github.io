/* ═══════════════════════════════════════════════════════
   NumPy Visual Explorer — Interactive Application Logic
   7 Lab Modules · Pure Vanilla JS · No Dependencies
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── HELPERS ─── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };

  /* ─── IntersectionObserver – Sidebar auto-highlight ─── */
  function initNav() {
    const links = $$('.nav-link');
    const sections = links.map(l => $(l.getAttribute('href')));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const link = links.find(l => l.getAttribute('href') === '#' + en.target.id);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px' });
    sections.forEach(s => { if (s) io.observe(s); });
    links.forEach(l => l.addEventListener('click', e => {
      e.preventDefault();
      $(l.getAttribute('href')).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }

  /* ═══════════════════════════════════════
     SECTION 1 — Array Lab
     ═══════════════════════════════════════ */
  const S1 = {
    dim: 1, cols: 6, rows: 3, depth: 2, dtype: 'int64', layer: 0,
    init() {
      $$('#s1-dim-btns .toggle').forEach(b => b.addEventListener('click', () => {
        $$('#s1-dim-btns .toggle').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        S1.dim = +b.dataset.dim;
        $('#s1-rows-g').classList.toggle('hidden', S1.dim === 1);
        $('#s1-depth-g').classList.toggle('hidden', S1.dim < 3);
        S1.render();
      }));
      $('#s1-cols').addEventListener('input', e => { S1.cols = +e.target.value; $('#s1-cols-v').textContent = S1.cols; S1.render(); });
      $('#s1-rows').addEventListener('input', e => { S1.rows = +e.target.value; $('#s1-rows-v').textContent = S1.rows; S1.render(); });
      $('#s1-depth').addEventListener('input', e => { S1.depth = +e.target.value; $('#s1-depth-v').textContent = S1.depth; S1.render(); });
      $('#s1-dtype').addEventListener('change', e => { S1.dtype = e.target.value; S1.render(); });
      S1.render();
    },
    render() {
      const { dim, cols, rows, depth, dtype, layer } = S1;
      const r = dim >= 2 ? rows : 1;
      const d = dim === 3 ? depth : 1;
      const size = cols * r * d;
      const itemBytes = dtype === 'bool' ? 1 : dtype === 'int32' ? 4 : 8;
      const nbytes = size * itemBytes;
      const shape = dim === 1 ? `(${cols},)` : dim === 2 ? `(${r}, ${cols})` : `(${d}, ${r}, ${cols})`;

      $('#s1-ndim').textContent = dim;
      $('#s1-shape').textContent = shape;
      $('#s1-size').textContent = size;
      $('#s1-nbytes').textContent = nbytes + ' B';

      // Layer tabs for 3D
      const tabWrap = $('#s1-layers');
      if (dim === 3) {
        tabWrap.classList.remove('hidden');
        tabWrap.innerHTML = '';
        for (let i = 0; i < d; i++) {
          const t = el('button', 'layer-tab' + (i === S1.layer ? ' active' : ''), `Layer ${i}`);
          t.addEventListener('click', () => { S1.layer = i; S1.render(); });
          tabWrap.appendChild(t);
        }
      } else {
        tabWrap.classList.add('hidden');
        S1.layer = 0;
      }

      // Build grid
      const grid = $('#s1-grid');
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      const layerOffset = S1.layer * r * cols;
      for (let i = 0; i < r * cols; i++) {
        const idx = layerOffset + i + 1;
        let val;
        if (dtype === 'bool') val = idx % 2 === 0 ? 'True' : 'False';
        else if (dtype === 'float64') val = (idx + 0.25).toFixed(2);
        else val = idx;
        const c = el('div', 'cell', val);
        grid.appendChild(c);
      }

      // Code output
      const total = size;
      let code;
      if (dim === 1) code = `arr = np.arange(1, ${total + 1}).astype(np.${dtype})`;
      else if (dim === 2) code = `arr = np.arange(1, ${total + 1}).reshape(${r}, ${cols}).astype(np.${dtype})`;
      else code = `arr = np.arange(1, ${total + 1}).reshape(${d}, ${r}, ${cols}).astype(np.${dtype})`;
      $('#s1-code').textContent = code;
    }
  };

  /* ═══════════════════════════════════════
     SECTION 2 — Vectorization Lab
     ═══════════════════════════════════════ */
  const S2_DATA = [2, 5, -1, 8, 3, 0, 7, -4, 6, 1, 9, -2];
  const S2 = {
    op: 'add', scalar: 3, stepping: false,
    init() {
      $$('#s2-op-btns .toggle').forEach(b => b.addEventListener('click', () => {
        $$('#s2-op-btns .toggle').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        S2.op = b.dataset.op;
        S2.reset();
      }));
      $('#s2-scalar').addEventListener('input', e => { S2.scalar = +e.target.value; $('#s2-scalar-v').textContent = S2.scalar; });
      $('#s2-step').addEventListener('click', () => S2.stepLoop());
      $('#s2-vec').addEventListener('click', () => S2.vectorize());
      $('#s2-reset').addEventListener('click', () => S2.reset());
      $('#s2-sz').addEventListener('input', e => { S2.updateSpeed(+e.target.value); });
      S2.renderInput();
      S2.reset();
      S2.updateSpeed(4);
    },
    calc(v) {
      const s = S2.scalar;
      switch (S2.op) {
        case 'add': return v + s;
        case 'mul': return v * s;
        case 'pow': return v * v;
        case 'gt': return v > s ? 'T' : 'F';
      }
    },
    renderInput() {
      const g = $('#s2-in');
      g.innerHTML = '';
      g.style.gridTemplateColumns = 'repeat(4, 1fr)';
      S2_DATA.forEach(v => g.appendChild(el('div', 'cell', v)));
    },
    reset(keepStepping = false) {
      if (!keepStepping) S2.stepping = false;
      const g = $('#s2-out');
      g.innerHTML = '';
      g.style.gridTemplateColumns = 'repeat(4, 1fr)';
      S2_DATA.forEach(() => g.appendChild(el('div', 'cell dim', '…')));
    },
    async stepLoop() {
      if (S2.stepping) return;
      S2.stepping = true;
      S2.reset(true);
      const cells = $$('.cell', $('#s2-out'));
      const inCells = $$('.cell', $('#s2-in'));
      for (let i = 0; i < S2_DATA.length; i++) {
        if (!S2.stepping) return;
        inCells[i].classList.add('step-active');
        cells[i].classList.add('step-active');
        cells[i].textContent = '…';
        await new Promise(r => setTimeout(r, 250));
        cells[i].textContent = S2.calc(S2_DATA[i]);
        cells[i].classList.remove('step-active', 'dim');
        cells[i].classList.add('pop');
        inCells[i].classList.remove('step-active');
        await new Promise(r => setTimeout(r, 120));
      }
      S2.stepping = false;
    },
    vectorize() {
      S2.stepping = false;
      const g = $('#s2-out');
      g.innerHTML = '';
      g.style.gridTemplateColumns = 'repeat(4, 1fr)';
      S2_DATA.forEach(v => {
        const c = el('div', 'cell pop', S2.calc(v));
        g.appendChild(c);
      });
    },
    updateSpeed(logVal) {
      const n = Math.round(Math.pow(10, logVal));
      const formatted = n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : n;
      $('#s2-sz-v').textContent = formatted.toLocaleString();
      const loopMs = n * 0.012;
      const vecMs = n * 0.00003;
      const maxMs = Math.max(loopMs, 1);
      const loopPct = Math.min((loopMs / maxMs) * 85, 95);
      const vecPct = Math.max((vecMs / maxMs) * 85, 2);
      $('#s2-loop-bar').style.width = loopPct + '%';
      $('#s2-vec-bar').style.width = vecPct + '%';
      $('#s2-loop-t').textContent = loopMs >= 1000 ? (loopMs / 1000).toFixed(1) + ' s' : '~' + loopMs.toFixed(1) + ' ms';
      $('#s2-vec-t').textContent = '~' + (vecMs < 1 ? vecMs.toFixed(2) : vecMs.toFixed(1)) + ' ms';
    }
  };

  /* ═══════════════════════════════════════
     SECTION 3 — Broadcasting Playground
     ═══════════════════════════════════════ */
  const S3_BASE = [[10, 20, 30], [40, 50, 60]];
  const S3 = {
    scenario: 'row',
    init() {
      $$('#s3-btns .toggle').forEach(b => b.addEventListener('click', () => {
        $$('#s3-btns .toggle').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        S3.scenario = b.dataset.sc;
        S3.render();
      }));
      S3.render();
    },
    render() {
      const sc = S3.scenario;
      const base = S3_BASE;
      const errOverlay = $('#s3-error');
      errOverlay.classList.add('hidden');

      // Operand
      let operand, opShape, virtual, result;
      if (sc === 'row') {
        opShape = '(3,)';
        operand = [[1, 2, 3]];
        virtual = [[1, 2, 3], [1, 2, 3]];
        result = base.map((r, ri) => r.map((v, ci) => v + virtual[ri][ci]));
      } else if (sc === 'col') {
        opShape = '(2, 1)';
        operand = [[100], [200]];
        virtual = [[100, 100, 100], [200, 200, 200]];
        result = base.map((r, ri) => r.map((v, ci) => v + virtual[ri][ci]));
      } else if (sc === 'scalar') {
        opShape = '()';
        operand = [[5]];
        virtual = [[5, 5, 5], [5, 5, 5]];
        result = base.map(r => r.map(v => v + 5));
      } else {
        opShape = '(4,)';
        operand = [[1, 2, 3, 4]];
        virtual = null;
        result = null;
      }

      // Compat badge
      $('#s3-op-shape').textContent = opShape;
      const badge = $('#s3-badge');
      if (sc === 'error') {
        badge.textContent = '✗ Incompatible';
        badge.className = 'compat-badge fail';
        errOverlay.classList.remove('hidden');
        $('#s3-err-shapes').textContent = `(2, 3) ${opShape}`;
      } else {
        badge.textContent = '✓ Compatible';
        badge.className = 'compat-badge ok';
      }

      // Base grid
      S3.drawGrid('#s3-base', base, 3);

      // Operand grid
      const opCols = operand[0].length;
      S3.drawGrid('#s3-operand', operand, opCols);

      // Virtual
      if (virtual) {
        $('#s3-virtual').parentElement.classList.remove('hidden');
        const vg = $('#s3-virtual');
        vg.innerHTML = '';
        vg.style.gridTemplateColumns = `repeat(3, 1fr)`;
        virtual.forEach(r => r.forEach(v => {
          vg.appendChild(el('div', 'cell', v));
        }));
      } else {
        // hide virtual on error
        $('#s3-virtual').innerHTML = '<div class="cell error-cell">—</div>';
      }

      // Result
      if (result) {
        S3.drawGrid('#s3-result', result, 3);
      } else {
        const rg = $('#s3-result');
        rg.innerHTML = '';
        rg.style.gridTemplateColumns = `repeat(3, 1fr)`;
        for (let i = 0; i < 6; i++) rg.appendChild(el('div', 'cell error-cell', '✗'));
      }
    },
    drawGrid(sel, data, cols) {
      const g = $(sel);
      g.innerHTML = '';
      g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      data.forEach(r => r.forEach(v => g.appendChild(el('div', 'cell', v))));
    }
  };

  /* ═══════════════════════════════════════
     SECTION 4 — Boolean Masking
     ═══════════════════════════════════════ */
  const S4_DATA = [[2, 8, 5, 11, 3, 14], [7, 1, 9, 0, 12, 6], [15, 4, 10, -1, 8, 13]];
  const S4 = {
    threshold: 6,
    init() {
      $('#s4-thr').addEventListener('input', e => { S4.threshold = +e.target.value; $('#s4-thr-v').textContent = S4.threshold; S4.render(); });
      S4.render();
    },
    render() {
      const thr = S4.threshold;
      const flat = S4_DATA.flat();
      const total = flat.length;
      const selected = flat.filter(v => v > thr);

      // Counter
      $('#s4-counter').textContent = `${selected.length} of ${total} selected`;

      // Input grid
      const ig = $('#s4-input');
      ig.innerHTML = '';
      ig.style.gridTemplateColumns = 'repeat(6, 1fr)';
      flat.forEach(v => {
        const cls = v > thr ? 'cell highlight' : 'cell';
        ig.appendChild(el('div', cls, v));
      });

      // Mask grid
      const mg = $('#s4-mask');
      mg.innerHTML = '';
      mg.style.gridTemplateColumns = 'repeat(6, 1fr)';
      flat.forEach(v => {
        const isTrue = v > thr;
        mg.appendChild(el('div', isTrue ? 'cell true-cell' : 'cell false-cell', isTrue ? 'True' : 'False'));
      });

      // Subset chips
      const cw = $('#s4-subset');
      cw.innerHTML = '';
      selected.forEach(v => cw.appendChild(el('span', 'chip', v)));

      // Code
      $('#s4-code').textContent = `arr[arr > ${thr}]  →  [${selected.join(', ')}]`;
    }
  };

  /* ═══════════════════════════════════════
     SECTION 5 — Reductions
     ═══════════════════════════════════════ */
  const S5_DATA = [[10, 20, 30], [40, 50, 60], [70, 80, 90]];
  const S5 = {
    op: 'sum', axis: 'all',
    init() {
      $$('#s5-op-btns .toggle').forEach(b => b.addEventListener('click', () => {
        $$('#s5-op-btns .toggle').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        S5.op = b.dataset.op;
        S5.render();
      }));
      $$('#s5-ax-btns .toggle').forEach(b => b.addEventListener('click', () => {
        $$('#s5-ax-btns .toggle').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        S5.axis = b.dataset.ax;
        S5.render();
      }));
      S5.render();
    },
    reduce(arr, op) {
      switch (op) {
        case 'sum': return arr.reduce((a, b) => a + b, 0);
        case 'mean': return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
        case 'min': return Math.min(...arr);
        case 'max': return Math.max(...arr);
      }
    },
    render() {
      const { op, axis } = S5;
      const data = S5_DATA;
      const rows = data.length, cols = data[0].length;

      // Input grid with color classes
      const ig = $('#s5-input');
      ig.innerHTML = '';
      ig.className = 'grid-wrap colored' + (axis === '0' ? ' by-row' : axis === '1' ? ' by-col' : '');
      ig.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      data.forEach((r, ri) => r.forEach((v, ci) => {
        const c = el('div', `cell row-${ri} col-${ci}`, v);
        ig.appendChild(c);
      }));

      // Result
      const rg = $('#s5-result');
      rg.innerHTML = '';
      rg.className = 'grid-wrap result';
      if (axis === 'all') {
        const val = S5.reduce(data.flat(), op);
        rg.style.gridTemplateColumns = '1fr';
        rg.appendChild(el('div', 'cell', val));
      } else if (axis === '0') {
        // collapse rows → one value per column
        rg.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        for (let c = 0; c < cols; c++) {
          const colVals = data.map(r => r[c]);
          rg.appendChild(el('div', 'cell', S5.reduce(colVals, op)));
        }
      } else {
        // collapse cols → one value per row
        rg.style.gridTemplateColumns = '1fr';
        for (let r = 0; r < rows; r++) {
          rg.appendChild(el('div', 'cell', S5.reduce(data[r], op)));
        }
      }
    }
  };

  /* ═══════════════════════════════════════
     SECTION 6 — Matrix Math (Dot Product)
     ═══════════════════════════════════════ */
  const S6_A = [[1, 3, 5], [2, 4, 6]];
  const S6 = {
    x: [1, 2, 3],
    init() {
      ['x0', 'x1', 'x2'].forEach((id, i) => {
        $(`#s6-${id}`).addEventListener('input', e => {
          S6.x[i] = +e.target.value;
          $(`#s6-${id}-v`).textContent = S6.x[i];
          S6.render();
        });
      });
      S6.render();
    },
    render() {
      const A = S6_A, x = S6.x;

      // Matrix A grid
      const ag = $('#s6-A');
      ag.innerHTML = '';
      ag.style.gridTemplateColumns = 'repeat(3, 1fr)';
      A.flat().forEach(v => ag.appendChild(el('div', 'cell', v)));

      // Vector x grid
      const xg = $('#s6-x');
      xg.innerHTML = '';
      x.forEach(v => xg.appendChild(el('div', 'cell', v)));

      // Result
      const results = A.map(row => row.reduce((sum, val, i) => sum + val * x[i], 0));
      const rg = $('#s6-res');
      rg.innerHTML = '';
      results.forEach(v => rg.appendChild(el('div', 'cell pop', v)));

      // Formula breakdown
      A.forEach((row, ri) => {
        const parts = row.map((v, ci) => `${v}×${x[ci]}`).join(' + ');
        const vals = row.map((v, ci) => v * x[ci]);
        $(`#s6-f${ri}`).innerHTML = `<b>row ${ri}:</b> ${parts} = ${vals.join(' + ')} = <span class="result-val">${results[ri]}</span>`;
      });
    }
  };

  /* ═══════════════════════════════════════
     SECTION 7 — Quiz
     ═══════════════════════════════════════ */
  function initQuiz() {
    $$('.quiz-card').forEach(card => {
      const correct = +card.dataset.correct;
      const opts = $$('.quiz-opt', card);
      const explain = $('.quiz-explain', card);
      opts.forEach(btn => {
        btn.addEventListener('click', () => {
          opts.forEach(o => o.disabled = true);
          const chosen = +btn.dataset.i;
          if (chosen === correct) {
            btn.classList.add('correct');
          } else {
            btn.classList.add('wrong');
            opts[correct].classList.add('correct');
          }
          explain.classList.remove('hidden');
        });
      });
    });
  }

  /* ─── BOOT ─── */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    S1.init();
    S2.init();
    S3.init();
    S4.init();
    S5.init();
    S6.init();
    initQuiz();
  });

})();
