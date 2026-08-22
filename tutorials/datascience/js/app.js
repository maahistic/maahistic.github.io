(function () {
  "use strict";
  var DS = window.DS;

  /* ===== mountChart ===== */
  DS.mountChart = function (canvas, getSpec) {
    function draw() {
      var spec = typeof getSpec === "function" ? getSpec() : getSpec;
      DS.chart(canvas, spec);
    }
    DS._charts.push(draw);
    requestAnimationFrame(draw);
    return draw;
  };

  function redrawCharts() {
    DS._charts.forEach(function (d) { try { d(); } catch (e) { /* skip */ } });
  }

  /* ===== Theme ===== */
  var store = {
    get: function (k) { try { return localStorage.getItem("dse:" + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("dse:" + k, v); } catch (e) { /* noop */ } }
  };

  function getPreferredTheme() {
    var saved = store.get("theme");
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    store.set("theme", theme);
    var btn = document.getElementById("theme-btn");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
    requestAnimationFrame(function () { redrawCharts(); });
    setTimeout(function () { redrawCharts(); }, 50);
  }

  applyTheme(getPreferredTheme());

  /* ===== Build Sidebar ===== */
  var sidebar = document.getElementById("sidebar");
  var sidebarNav = sidebar.querySelector(".sidebar-nav");
  var sorted = DS.topics.slice().sort(function (a, b) { return a.order - b.order; });

  sorted.forEach(function (t) {
    var a = document.createElement("a");
    a.href = "#/" + t.id;
    a.dataset.id = t.id;
    a.innerHTML = '<span class="nav-icon">' + t.icon + '</span><span>' + t.title + '</span>';
    var tail = document.createElement("span");
    tail.className = "nav-tail";
    tail.textContent = t.order;
    a.appendChild(tail);
    sidebarNav.appendChild(a);
  });

  function updateSidebarProgress() {
    sidebarNav.querySelectorAll("a").forEach(function (a) {
      var id = a.dataset.id;
      var topic = null;
      DS.topics.forEach(function (t) { if (t.id === id) topic = t; });
      var tail = a.querySelector(".nav-tail");
      if (topic && topic.countable && DS.progress.isDone(id)) {
        tail.textContent = "✓";
        tail.classList.add("nav-check");
      } else if (topic) {
        tail.textContent = topic.order;
        tail.classList.remove("nav-check");
      }
    });
    // Update progress pill
    var countable = DS.topics.filter(function (t) { return t.countable; });
    var done = countable.filter(function (t) { return DS.progress.isDone(t.id); }).length;
    var pct = countable.length ? Math.round(done / countable.length * 100) : 0;
    var pill = document.getElementById("progress-pill");
    if (pill) pill.textContent = pct + "% complete";
  }

  window.addEventListener("dse:progress", updateSidebarProgress);
  updateSidebarProgress();

  /* ===== Router ===== */
  var app = document.getElementById("app");

  function route() {
    var hash = location.hash.replace(/^#\/?/, "") || "home";
    var topic = null;
    DS.topics.forEach(function (t) { if (t.id === hash) topic = t; });
    if (!topic) { topic = DS.topics.filter(function (t) { return t.id === "home"; })[0]; hash = "home"; }

    // Clear app
    app.innerHTML = "";
    DS._charts = [];

    // Update title
    document.title = topic.title + " — Data Science Explorer";

    // Render
    topic.render(app);

    // Active nav
    sidebarNav.querySelectorAll("a").forEach(function (a) {
      a.classList.toggle("active", a.dataset.id === hash);
    });

    // Close mobile menu
    sidebar.classList.remove("open");
    document.getElementById("scrim").classList.remove("open");

    // Scroll to top
    window.scrollTo(0, 0);

    // Redraw charts after layout settles
    requestAnimationFrame(redrawCharts);
    setTimeout(redrawCharts, 80);
  }

  window.addEventListener("hashchange", route);
  route();

  /* ===== Theme Button ===== */
  document.getElementById("theme-btn").addEventListener("click", function () {
    var current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });

  /* ===== Mobile Menu ===== */
  var hamburger = document.getElementById("hamburger");
  var scrim = document.getElementById("scrim");
  hamburger.addEventListener("click", function () {
    sidebar.classList.toggle("open");
    scrim.classList.toggle("open");
  });
  scrim.addEventListener("click", function () {
    sidebar.classList.remove("open");
    scrim.classList.remove("open");
  });

  /* Sidebar link clicks close mobile menu */
  sidebarNav.addEventListener("click", function () {
    sidebar.classList.remove("open");
    scrim.classList.remove("open");
  });

  /* ===== Reset Progress ===== */
  document.getElementById("reset-btn").addEventListener("click", function () {
    if (confirm("Reset all progress? This cannot be undone.")) {
      DS.progress.reset();
      updateSidebarProgress();
      route();
    }
  });

  /* ===== Resize redraw ===== */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redrawCharts, 150);
  });

})();
