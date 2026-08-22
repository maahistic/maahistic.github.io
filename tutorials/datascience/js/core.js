(function () {
  "use strict";

  var DS = (window.DS = window.DS || {});
  DS.topics = [];
  DS._charts = [];

  /* ===== Topic Registry ===== */
  DS.registerTopic = function (t) {
    DS.topics.push(t);
  };

  /* ===== DOM Builder ===== */
  DS.el = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") el.className = attrs[k];
        else if (k === "html") el.innerHTML = attrs[k];
        else if (k === "text") el.textContent = attrs[k];
        else if (k === "style" && typeof attrs[k] === "object") {
          Object.keys(attrs[k]).forEach(function (s) { el.style[s] = attrs[k][s]; });
        } else if (k === "dataset" && typeof attrs[k] === "object") {
          Object.keys(attrs[k]).forEach(function (d) { el.dataset[d] = attrs[k][d]; });
        } else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") {
          el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (typeof attrs[k] === "boolean") {
          if (attrs[k]) el.setAttribute(k, "");
        } else {
          el.setAttribute(k, attrs[k]);
        }
      });
    }
    var children = Array.prototype.slice.call(arguments, 2);
    function append(c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(append); return; }
      if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    }
    children.forEach(append);
    return el;
  };

  /* ===== setContext ===== */
  DS.setContext = function (el, c) {
    if (typeof c === "string") el.innerHTML = c;
    else if (Array.isArray(c)) c.forEach(function (ch) { if (ch) el.appendChild(ch); });
    else if (c instanceof Node) el.appendChild(c);
  };

  /* ===== Escape HTML ===== */
  DS.escapeHtml = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };
  /* ===== Python Syntax Highlighter ===== */
  DS.pyHighlight = function (code) {
    var keywords = {};
    "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" ").forEach(function (k) { keywords[k] = true; });
    var builtins = {};
    "print len range list dict set tuple int float str bool sum min max abs sorted enumerate zip map filter type round open input format isinstance reversed any all np pd plt".split(" ").forEach(function (k) { builtins[k] = true; });

    // Scan the raw code and produce HTML directly
    var out = "";
    var i = 0;
    var len = code.length;

    function esc(s) { return DS.escapeHtml(s); }

    while (i < len) {
      var ch = code[i];
      // Comment
      if (ch === "#") {
        var end = code.indexOf("\n", i);
        if (end === -1) end = len;
        out += '<span class="tok-com">' + esc(code.slice(i, end)) + "</span>";
        i = end;
        continue;
      }
      // String (single/double, triple-quoted)
      if (ch === '"' || ch === "'") {
        var q = ch;
        var triple = (i + 2 < len && code[i + 1] === q && code[i + 2] === q);
        var close, start = i;
        if (triple) {
          close = code.indexOf(q + q + q, i + 3);
          if (close === -1) close = len - 3;
          close += 3;
        } else {
          close = i + 1;
          while (close < len && code[close] !== q) {
            if (code[close] === "\\") close++;
            close++;
          }
          if (close < len) close++;
        }
        out += '<span class="tok-str">' + esc(code.slice(start, close)) + "</span>";
        i = close;
        continue;
      }
      // Number
      if ((ch >= "0" && ch <= "9") || (ch === "." && i + 1 < len && code[i + 1] >= "0" && code[i + 1] <= "9")) {
        var ns = i;
        while (i < len && ((code[i] >= "0" && code[i] <= "9") || code[i] === ".")) i++;
        out += '<span class="tok-num">' + esc(code.slice(ns, i)) + "</span>";
        continue;
      }
      // Identifier / keyword / builtin / function
      if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
        var ws = i;
        while (i < len && ((code[i] >= "a" && code[i] <= "z") || (code[i] >= "A" && code[i] <= "Z") || (code[i] >= "0" && code[i] <= "9") || code[i] === "_")) i++;
        var word = code.slice(ws, i);
        // Check if followed by ( => function call
        var j = i;
        while (j < len && (code[j] === " " || code[j] === "\t")) j++;
        if (keywords[word]) out += '<span class="tok-kw">' + esc(word) + "</span>";
        else if (builtins[word]) out += '<span class="tok-bi">' + esc(word) + "</span>";
        else if (j < len && code[j] === "(") out += '<span class="tok-fn">' + esc(word) + "</span>";
        else out += esc(word);
        continue;
      }
      // Other character
      out += esc(ch);
      i++;
    }
    return out;
  };

  /* ===== Code Block ===== */
  DS.codeBlock = function (code, lang) {
    code = code.replace(/^\n/, "");
    lang = lang || "python";
    var highlighted = lang === "python" ? DS.pyHighlight(code) : DS.escapeHtml(code);
    var wrap = DS.el("div", { class: "code" });
    var head = DS.el("div", { class: "code-head" },
      DS.el("span", { class: "code-dot r" }),
      DS.el("span", { class: "code-dot y" }),
      DS.el("span", { class: "code-dot g" }),
      DS.el("span", { class: "lang", text: lang })
    );
    var copyBtn = DS.el("button", { class: "copy-btn", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      try {
        navigator.clipboard.writeText(code).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      } catch (e) {
        copyBtn.textContent = "Copied!";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      }
    });
    head.appendChild(copyBtn);
    var body = DS.el("div", { class: "code-body" }, DS.el("pre", { html: highlighted }));
    wrap.appendChild(head);
    wrap.appendChild(body);
    return wrap;
  };

  /* ===== Runnable ===== */
  DS.runnable = function (code, output, note) {
    var wrap = DS.el("div");
    wrap.appendChild(DS.codeBlock(code));
    var outBox = DS.el("div", { class: "output", style: { display: "none" }, text: output });
    var runBtn = DS.el("button", { class: "btn small run-btn", text: "▶ Run" });
    var shown = false;
    runBtn.addEventListener("click", function () {
      shown = !shown;
      outBox.style.display = shown ? "block" : "none";
      runBtn.textContent = shown ? "Hide output" : "▶ Run";
    });
    wrap.appendChild(runBtn);
    wrap.appendChild(outBox);
    if (note !== undefined) {
      wrap.appendChild(DS.el("div", { class: "run-note", text: note || "Simulated output — no real Python runs in the browser." }));
    } else {
      wrap.appendChild(DS.el("div", { class: "run-note", text: "Simulated output — no real Python runs in the browser." }));
    }
    return wrap;
  };

  /* ===== Callout ===== */
  DS.callout = function (type, content) {
    var c = DS.el("div", { class: "callout " + type });
    if (typeof content === "string") c.innerHTML = content;
    else if (content instanceof Node) c.appendChild(content);
    return c;
  };

  /* ===== Widget ===== */
  DS.widget = function (title, icon, tag) {
    var w = DS.el("div", { class: "widget" });
    var head = DS.el("div", { class: "widget-head" },
      DS.el("span", { class: "wh-icon", text: icon }),
      DS.el("span", { text: title })
    );
    if (tag) head.appendChild(DS.el("span", { class: "wh-tag", text: tag }));
    w.appendChild(head);
    var body = DS.el("div", { class: "widget-body" });
    var bodyChildren = Array.prototype.slice.call(arguments, 3);
    bodyChildren.forEach(function (ch) {
      if (ch instanceof Node) body.appendChild(ch);
      else if (typeof ch === "string") body.innerHTML += ch;
    });
    w.appendChild(body);
    return w;
  };

  /* ===== Tabs ===== */
  DS.tabs = function (items) {
    var wrap = DS.el("div", { class: "tabs" });
    var bar = DS.el("div", { class: "tab-bar" });
    var panels = [];
    items.forEach(function (item, i) {
      var btn = DS.el("button", { class: "tab-btn" + (i === 0 ? " active" : ""), text: item.label });
      var panel = DS.el("div", { class: "tab-panel" + (i === 0 ? " active" : "") });
      if (typeof item.content === "function") {
        var result = item.content();
        if (typeof result === "string") panel.innerHTML = result;
        else if (result instanceof Node) panel.appendChild(result);
      } else if (typeof item.content === "string") {
        panel.innerHTML = item.content;
      } else if (item.content instanceof Node) {
        panel.appendChild(item.content);
      }
      btn.addEventListener("click", function () {
        bar.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
        panels.forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        panel.classList.add("active");
      });
      bar.appendChild(btn);
      panels.push(panel);
    });
    wrap.appendChild(bar);
    panels.forEach(function (p) { wrap.appendChild(p); });
    return wrap;
  };

  /* ===== Quiz ===== */
  DS.quiz = function (cfg) {
    var score = 0;
    var total = cfg.questions ? cfg.questions.length : (cfg.length || 0);
    var questions = cfg.questions || cfg;
    var title = cfg.title || "Quiz";
    var wrap = DS.el("div", { class: "quiz" });
    var scoreSpan = DS.el("span", { class: "quiz-score", text: "0 / " + total });
    var header = DS.el("div", { class: "quiz-header" },
      DS.el("span", { text: "🧠" }),
      DS.el("span", { text: title }),
      scoreSpan
    );
    wrap.appendChild(header);
    var body = DS.el("div", { class: "quiz-body" });
    questions.forEach(function (q) {
      var qDiv = DS.el("div", { class: "quiz-q" });
      qDiv.appendChild(DS.el("p", { text: q.q }));
      var opts = DS.el("div", { class: "quiz-opts" });
      var locked = false;
      q.options.forEach(function (opt, oi) {
        var oBtn = DS.el("button", { class: "quiz-opt", text: opt });
        oBtn.addEventListener("click", function () {
          if (locked) return;
          locked = true;
          opts.querySelectorAll(".quiz-opt").forEach(function (b) { b.classList.add("locked"); });
          var correct = oi === q.answer;
          if (correct) {
            oBtn.classList.add("correct");
            score++;
            scoreSpan.textContent = score + " / " + total;
          } else {
            oBtn.classList.add("wrong");
            opts.children[q.answer].classList.add("correct");
          }
          if (q.explain) {
            var ex = DS.el("div", { class: "quiz-explain " + (correct ? "right" : "wrong-ex"), text: q.explain });
            qDiv.appendChild(ex);
          }
        });
        opts.appendChild(oBtn);
      });
      qDiv.appendChild(opts);
      body.appendChild(qDiv);
    });
    wrap.appendChild(body);
    return wrap;
  };

  /* ===== Page Nav ===== */
  DS.pageNav = function (currentId) {
    var sorted = DS.topics.slice().sort(function (a, b) { return a.order - b.order; });
    var idx = -1;
    sorted.forEach(function (t, i) { if (t.id === currentId) idx = i; });
    var nav = DS.el("div", { class: "page-nav" });
    if (idx > 0) {
      var prev = sorted[idx - 1];
      nav.appendChild(DS.el("a", { href: "#/" + prev.id, text: "← " + prev.title }));
    } else {
      nav.appendChild(DS.el("span"));
    }
    if (idx < sorted.length - 1) {
      var next = sorted[idx + 1];
      nav.appendChild(DS.el("a", { href: "#/" + next.id, text: next.title + " →" }));
    }
    return nav;
  };

  /* ===== Progress ===== */
  DS.progress = (function () {
    var KEY = "dse:progress";
    function load() {
      try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
    }
    function save(d) {
      try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* noop */ }
      window.dispatchEvent(new Event("dse:progress"));
    }
    return {
      isDone: function (id) { return !!load()[id]; },
      set: function (id, val) { var d = load(); d[id] = val; save(d); },
      toggle: function (id) { var d = load(); d[id] = !d[id]; save(d); },
      reset: function () { save({}); },
      data: load
    };
  })();

  /* ===== Done Toggle ===== */
  DS.doneToggle = function (id) {
    var wrap = DS.el("div", { class: "done-toggle" });
    var done = DS.progress.isDone(id);
    var btn = DS.el("button", {
      class: "btn " + (done ? "secondary" : ""),
      text: done ? "✓ Completed — click to undo" : "Mark as complete ✓"
    });
    btn.addEventListener("click", function () {
      DS.progress.toggle(id);
      done = DS.progress.isDone(id);
      btn.textContent = done ? "✓ Completed — click to undo" : "Mark as complete ✓";
      btn.className = "btn " + (done ? "secondary" : "");
    });
    wrap.appendChild(btn);
    return wrap;
  };

  /* ===== Math Helpers ===== */
  DS.range = function (n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; };
  DS.linspace = function (a, b, n) {
    var out = []; var step = (b - a) / (n - 1);
    for (var i = 0; i < n; i++) out.push(a + step * i);
    return out;
  };
  DS.sum = function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; };
  DS.mean = function (a) { return DS.sum(a) / a.length; };
  DS.median = function (a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  DS.mode = function (a) {
    var freq = {}, maxF = 0, modes = [];
    a.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; if (freq[v] > maxF) maxF = freq[v]; });
    Object.keys(freq).forEach(function (k) { if (freq[k] === maxF) modes.push(Number(k)); });
    return modes.length === a.length ? null : modes[0];
  };
  DS.variance = function (a, pop) {
    var m = DS.mean(a), s = 0;
    a.forEach(function (v) { s += (v - m) * (v - m); });
    return s / (pop ? a.length : a.length - 1);
  };
  DS.std = function (a, pop) { return Math.sqrt(DS.variance(a, pop)); };
  DS.round = function (x, d) { d = d === undefined ? 2 : d; var f = Math.pow(10, d); return Math.round(x * f) / f; };
  DS.clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  DS.formatNum = function (x) {
    if (Number.isInteger(x) && Math.abs(x) < 1000) return String(x);
    if (Number.isInteger(x)) return x.toLocaleString();
    return DS.round(x, 2).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  /* ===== Exact Algorithms ===== */
  DS.mulberry32 = function (a) {
    return function () {
      var t = a += 1831565813;
      t = Math.imul(t ^ t >>> 15, 1 | t);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  DS.normalSeq = function (n, seed) {
    var rnd = DS.mulberry32(seed), out = [];
    for (var i = 0; i < n; i += 2) {
      var u = Math.max(1e-9, rnd()), v = rnd();
      out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
    }
    return out;
  };

  /* Python slice semantics */
  DS.adjustSlice = function (len, start, stop, step) {
    if (step === 0) throw "step cannot be 0";
    var lower = step < 0 ? -1 : 0, upper = step < 0 ? len - 1 : len;
    if (start === null) start = step < 0 ? upper : lower;
    else { if (start < 0) start += len; start = start < lower ? lower : start > upper ? upper : start; }
    if (stop === null) stop = step < 0 ? lower : upper;
    else { if (stop < 0) stop += len; stop = stop < lower ? lower : stop > upper ? upper : stop; }
    var out = [];
    if (step > 0) for (var i = start; i < stop; i += step) out.push(i);
    else for (var i = start; i > stop; i += step) out.push(i);
    return out;
  };

  DS.parseSlice = function (s) {
    s = s.trim();
    if (s.indexOf(":") === -1) {
      var v = parseInt(s, 10);
      if (isNaN(v)) throw "invalid index: " + s;
      return { type: "index", value: v };
    }
    var parts = s.split(":");
    function p(x) { x = x.trim(); return x === "" ? null : parseInt(x, 10); }
    var start = p(parts[0]);
    var stop = parts.length > 1 ? p(parts[1]) : null;
    var step = parts.length > 2 ? p(parts[2]) : 1;
    if (step === null) step = 1;
    if ((start !== null && isNaN(start)) || (stop !== null && isNaN(stop)) || isNaN(step)) throw "invalid slice";
    return { type: "slice", start: start, stop: stop, step: step };
  };

  /* Coolwarm color */
  DS.coolwarm = function (v) {
    v = Math.max(-1, Math.min(1, v));
    var blue = [59, 76, 192], white = [242, 242, 242], red = [180, 4, 38];
    var c1 = v < 0 ? blue : white, c2 = v < 0 ? white : red, t = v < 0 ? v + 1 : v;
    function lerp(a, b, t) { return a.map(function (x, i) { return Math.round(x + (b[i] - x) * t); }); }
    var c = lerp(c1, c2, t);
    var lum = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
    return { bg: "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")", fg: lum < 150 ? "#fff" : "#111" };
  };

  /* Pearson correlation */
  DS.pearsonR = function (x, y) {
    var n = x.length, mx = DS.mean(x), my = DS.mean(y);
    var num = 0, dx = 0, dy = 0;
    for (var i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx += (x[i] - mx) * (x[i] - mx);
      dy += (y[i] - my) * (y[i] - my);
    }
    return num / Math.sqrt(dx * dy);
  };

  DS.linearFit = function (x, y) {
    var mx = DS.mean(x), my = DS.mean(y);
    var num = 0, den = 0;
    for (var i = 0; i < x.length; i++) {
      num += (x[i] - mx) * (y[i] - my);
      den += (x[i] - mx) * (x[i] - mx);
    }
    var slope = num / den;
    return { slope: slope, intercept: my - slope * mx };
  };

  /* ===== Canvas Chart Engine ===== */
  var COLORS = ["--brand", "--brand-2", "--accent", "--good", "--bad"];
  var FALLBACK_COLORS = ["#4f46e5", "#0d9488", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  function getCSSColor(name) {
    var val = getComputedStyle(document.body).getPropertyValue(name).trim();
    return val || name;
  }

  function getChartColors() {
    return COLORS.map(getCSSColor).concat(["#8b5cf6", "#ec4899", "#14b8a6"]);
  }

  DS.chart = function (canvas, spec) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var W = rect.width || 500, H = rect.height || 300;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var textCol = getCSSColor("--text");
    var textSoft = getCSSColor("--text-soft");
    var borderCol = getCSSColor("--border");
    var bgElev = getCSSColor("--bg-elev");
    var colors = getChartColors();

    var pad = { top: 30, right: 24, bottom: 50, left: 60 };
    if (spec.yLabel) pad.left = 72;
    if (spec.type === "pie") { pad = { top: 20, right: 20, bottom: 20, left: 20 }; }
    var cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom;

    /* ---- Pie ---- */
    if (spec.type === "pie") {
      var vals = spec.values || (spec.series && spec.series[0] && spec.series[0].y) || [];
      var labels = spec.labels || [];
      var total = DS.sum(vals);
      var cx = pad.left + cw * 0.4, cy = pad.top + ch / 2, r = Math.min(cw * 0.38, ch / 2 - 10);
      var angle = -Math.PI / 2;
      vals.forEach(function (v, i) {
        var sweep = (v / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + sweep);
        ctx.closePath();
        ctx.fillStyle = spec.colors ? spec.colors[i] : colors[i % colors.length];
        ctx.fill();
        // % label inside
        var mid = angle + sweep / 2;
        var lx = cx + r * 0.65 * Math.cos(mid), ly = cy + r * 0.65 * Math.sin(mid);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(v / total * 100) + "%", lx, ly);
        angle += sweep;
      });
      // legend
      var lx = pad.left + cw * 0.78, ly = pad.top + 20;
      labels.forEach(function (l, i) {
        ctx.fillStyle = spec.colors ? spec.colors[i] : colors[i % colors.length];
        ctx.fillRect(lx, ly, 12, 12);
        ctx.fillStyle = textCol;
        ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(l, lx + 18, ly);
        ly += 22;
      });
      return;
    }

    /* ---- Data ranges ---- */
    var allX = [], allY = [];
    var series = spec.series || [];
    var categories = spec.categories;

    if (spec.type === "hist") {
      var data = spec.data || (series[0] && series[0].y) || [];
      var bins = spec.bins || 10;
      var mn = Math.min.apply(null, data), mx = Math.max.apply(null, data);
      var bw = (mx - mn) / bins;
      var counts = [];
      for (var i = 0; i < bins; i++) counts.push(0);
      data.forEach(function (v) {
        var bi = Math.min(Math.floor((v - mn) / bw), bins - 1);
        counts[bi]++;
      });
      // draw as bars
      var maxC = Math.max.apply(null, counts);
      var barW = cw / bins;
      // gridlines
      if (spec.grid !== false) {
        for (var g = 0; g <= 4; g++) {
          var gy = pad.top + ch - (g / 4) * ch;
          ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + cw, gy);
          ctx.strokeStyle = borderCol; ctx.lineWidth = 0.5; ctx.stroke();
          ctx.fillStyle = textSoft; ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          ctx.fillText(DS.round(maxC * g / 4, 0), pad.left - 8, gy);
        }
      }
      counts.forEach(function (c, i) {
        var x = pad.left + i * barW;
        var h = (c / maxC) * ch;
        ctx.fillStyle = spec.color || colors[0];
        ctx.fillRect(x + 1, pad.top + ch - h, barW - 2, h);
      });
      // x labels
      for (var i = 0; i <= bins; i += Math.max(1, Math.floor(bins / 6))) {
        var lx = pad.left + i * barW;
        ctx.fillStyle = textSoft;
        ctx.font = "10px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(DS.round(mn + i * bw, 0), lx, pad.top + ch + 6);
      }
      if (spec.xLabel) {
        ctx.fillStyle = textSoft; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center"; ctx.fillText(spec.xLabel, pad.left + cw / 2, H - 8);
      }
      if (spec.yLabel) {
        ctx.save(); ctx.translate(14, pad.top + ch / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = textSoft; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center"; ctx.fillText(spec.yLabel, 0, 0); ctx.restore();
      }
      return;
    }

    series.forEach(function (s, si) {
      var xs = s.x || (categories ? DS.range(categories.length) : DS.range(s.y.length));
      xs.forEach(function (x) { allX.push(x); });
      s.y.forEach(function (y) { allY.push(y); });
    });

    if (!allX.length) return;
    var xMin = categories ? -0.5 : Math.min.apply(null, allX);
    var xMax = categories ? allX.length - 0.5 : Math.max.apply(null, allX);
    var yMin = Math.min.apply(null, allY);
    var yMax = Math.max.apply(null, allY);

    // Add padding for scatter
    if (spec.type === "scatter" || spec.type === "line") {
      var yPad = (yMax - yMin) * 0.1 || 1;
      yMin -= yPad; yMax += yPad;
      if (!categories) {
        var xPad = (xMax - xMin) * 0.05 || 0.5;
        xMin -= xPad; xMax += xPad;
      }
    }
    if (spec.type === "bar") { yMin = Math.min(0, yMin); }

    function sx(v) { return pad.left + ((v - xMin) / (xMax - xMin)) * cw; }
    function sy(v) { return pad.top + ch - ((v - yMin) / (yMax - yMin)) * ch; }

    /* Gridlines */
    if (spec.grid !== false) {
      for (var g = 0; g <= 4; g++) {
        var yv = yMin + (g / 4) * (yMax - yMin);
        var gy = sy(yv);
        ctx.beginPath(); ctx.moveTo(pad.left, gy); ctx.lineTo(pad.left + cw, gy);
        ctx.strokeStyle = borderCol; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.fillStyle = textSoft; ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        ctx.fillText(DS.formatNum(DS.round(yv, 1)), pad.left - 8, gy);
      }
    }

    /* X labels */
    if (categories) {
      categories.forEach(function (c, i) {
        ctx.fillStyle = textSoft; ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(c, sx(i), pad.top + ch + 8);
      });
    } else {
      for (var g = 0; g <= 4; g++) {
        var xv = xMin + (g / 4) * (xMax - xMin);
        ctx.fillStyle = textSoft; ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.fillText(DS.formatNum(DS.round(xv, 1)), sx(xv), pad.top + ch + 8);
      }
    }

    /* Axis labels */
    if (spec.xLabel) {
      ctx.fillStyle = textSoft; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
      ctx.textAlign = "center"; ctx.fillText(spec.xLabel, pad.left + cw / 2, H - 6);
    }
    if (spec.yLabel) {
      ctx.save(); ctx.translate(14, pad.top + ch / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = textSoft; ctx.font = "12px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
      ctx.textAlign = "center"; ctx.fillText(spec.yLabel, 0, 0); ctx.restore();
    }

    /* Draw series */
    series.forEach(function (s, si) {
      var kind = s.kind || spec.type || "line";
      var col = s.color || colors[si % colors.length];
      var xs = s.x || (categories ? DS.range(categories.length) : DS.range(s.y.length));

      if (kind === "bar") {
        var nSeries = series.filter(function (s2) { return (s2.kind || spec.type) === "bar"; }).length;
        var barIdx = series.filter(function (s2, i2) { return i2 < si && (s2.kind || spec.type) === "bar"; }).length;
        var groupW = cw / xs.length * 0.7;
        var singleW = groupW / nSeries;
        xs.forEach(function (x, i) {
          var bx = sx(x) - groupW / 2 + barIdx * singleW;
          var bh = Math.abs(sy(s.y[i]) - sy(0));
          var by = s.y[i] >= 0 ? sy(s.y[i]) : sy(0);
          ctx.fillStyle = col;
          ctx.fillRect(bx, by, singleW - 1, bh);
        });
      } else if (kind === "scatter") {
        xs.forEach(function (x, i) {
          ctx.beginPath();
          ctx.arc(sx(x), sy(s.y[i]), 4, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.fill();
        });
      } else {
        // line
        ctx.beginPath();
        xs.forEach(function (x, i) {
          var px = sx(x), py = sy(s.y[i]);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // markers
        if (s.markers !== false) {
          xs.forEach(function (x, i) {
            ctx.beginPath();
            ctx.arc(sx(x), sy(s.y[i]), 3.5, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.fill();
            ctx.strokeStyle = bgElev;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });
        }
      }
    });

    /* Legend */
    if (series.length > 1) {
      var lx = pad.left + 8, ly = pad.top + 6;
      series.forEach(function (s, si) {
        if (!s.label) return;
        var col = s.color || colors[si % colors.length];
        ctx.fillStyle = col;
        ctx.fillRect(lx, ly, 14, 3);
        ctx.fillStyle = textCol;
        ctx.font = "11px " + getComputedStyle(document.body).getPropertyValue("--font-sans");
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(s.label, lx + 20, ly - 4);
        ly += 18;
      });
    }
  };

  /* ===== DataFrame Builder ===== */
  DS.buildTable = function (rows, columns, opts) {
    opts = opts || {};
    var wrap = DS.el("div", { class: "df" });
    var tw = DS.el("div", { class: "df-wrap" });
    var table = DS.el("table");
    var thead = DS.el("thead");
    var headRow = DS.el("tr");
    if (opts.showIndex !== false) headRow.appendChild(DS.el("th", { class: "idx", text: "" }));
    columns.forEach(function (col) {
      var th = DS.el("th", { text: col });
      if (opts.onSort) {
        th.style.cursor = "pointer";
        var arrow = DS.el("span", { class: "sort-arrow", text: "↕" });
        th.appendChild(arrow);
        th.addEventListener("click", function () { opts.onSort(col); });
      }
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = DS.el("tbody");
    rows.forEach(function (row, ri) {
      var tr = DS.el("tr");
      if (opts.showIndex !== false) tr.appendChild(DS.el("td", { class: "idx", text: ri }));
      columns.forEach(function (col) {
        tr.appendChild(DS.el("td", { text: row[col] !== undefined ? row[col] : "" }));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tw.appendChild(table);
    wrap.appendChild(tw);
    return wrap;
  };
})();
