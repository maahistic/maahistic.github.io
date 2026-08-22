(function () {
  "use strict";
  var el = DS.el;

  /* Distribution data — deterministic */
  var DIST_DATA = DS.normalSeq(200, 12345).map(function (z) { return Math.round(50 + 12 * z); });

  /* Correlation data seeds */
  var COR_N = 60;
  var COR_XS = DS.normalSeq(60, 777);
  var COR_NOISE = DS.normalSeq(60, 4242);

  DS.registerTopic({
    id: "statistics",
    title: "Statistics",
    icon: "📊",
    subtitle: "Center, spread, correlation — the math behind the insights",
    order: 6,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "📊 Statistics" }));
      root.appendChild(el("p", { class: "section-intro", text: "Statistics gives you the tools to summarize data, measure uncertainty, and test hypotheses. Here we cover the essentials: center, spread, and correlation." }));

      /* Center measures */
      root.appendChild(el("h2", { text: "Measures of center" }));
      root.appendChild(el("p", { html: "<strong>Mean</strong> — the arithmetic average. <strong>Median</strong> — the middle value when sorted. <strong>Mode</strong> — the most frequent value." }));
      root.appendChild(DS.callout("info", "The <strong>median</strong> is more robust to outliers. If your data is skewed (e.g., incomes), report the median."));

      /* Center & Spread Explorer */
      root.appendChild(el("h2", { text: "Center & Spread Explorer" }));

      var dataInput = el("input", { type: "text", value: "4, 8, 15, 16, 23, 42", style: { width: "100%", maxWidth: "400px" } });
      var statsRow = el("div", { class: "stat-row" });
      var numberLine = el("div", { class: "number-line", style: { height: "90px" } });
      var errorMsg = el("div", { class: "error-msg" });

      var presets = [
        { label: "Simple", data: "4, 8, 15, 16, 23, 42" },
        { label: "Symmetric", data: "10, 20, 30, 40, 50" },
        { label: "Outlier", data: "10, 32, 35, 38, 40, 900" },
        { label: "Repeats", data: "5, 5, 10, 10, 10, 15, 20" }
      ];

      function updateStats() {
        errorMsg.textContent = "";
        var raw = dataInput.value.split(",").map(function (s) { return parseFloat(s.trim()); }).filter(function (v) { return !isNaN(v); });
        if (raw.length < 2) { errorMsg.textContent = "Enter at least 2 numbers"; return; }

        var m = DS.mean(raw), med = DS.median(raw), mod = DS.mode(raw);
        var sd = DS.std(raw, false), mn = Math.min.apply(null, raw), mx = Math.max.apply(null, raw);

        statsRow.innerHTML = "";
        [
          { label: "Mean", val: DS.round(m) },
          { label: "Median", val: DS.round(med) },
          { label: "Mode", val: mod !== null ? mod : "—" },
          { label: "Std (sample)", val: DS.round(sd) },
          { label: "Min", val: mn },
          { label: "Max", val: mx }
        ].forEach(function (s) {
          statsRow.appendChild(el("div", { class: "stat-v" },
            el("div", { class: "s-val", text: s.val }),
            el("div", { class: "s-lab", text: s.label })
          ));
        });

        /* Number line */
        numberLine.innerHTML = "";
        var pad = 20;
        var range = mx - mn || 1;
        var track = el("div", { class: "nl-track" });
        numberLine.appendChild(track);

        // Points
        raw.forEach(function (v) {
          var pct = ((v - mn) / range) * 100;
          var p = el("div", { class: "nl-point", style: { left: "calc(" + pad + "px + " + pct + "% * (1 - " + (2 * pad) + "px / 100%))" } });
          p.style.left = (pad + pct * (1 - 2 * pad / numberLine.offsetWidth || 0.9)) + "px";
          numberLine.appendChild(p);
        });
        // Recalc with actual width after render
        setTimeout(function () {
          var w = numberLine.offsetWidth;
          var usable = w - 2 * pad;
          numberLine.querySelectorAll(".nl-point").forEach(function (pt, i) {
            var pct = (raw[i] - mn) / range;
            pt.style.left = (pad + pct * usable) + "px";
          });

          // Mean marker
          var meanPct = (m - mn) / range;
          var meanM = el("div", { class: "nl-marker", style: { left: (pad + meanPct * usable) + "px", height: "28px", top: "18%", background: "var(--brand)" } });
          numberLine.appendChild(meanM);
          numberLine.appendChild(el("div", { class: "nl-label", style: { left: (pad + meanPct * usable) + "px", color: "var(--brand)" }, text: "mean" }));

          // Median marker
          var medPct = (med - mn) / range;
          var medM = el("div", { class: "nl-marker", style: { left: (pad + medPct * usable) + "px", height: "28px", top: "18%", background: "var(--accent)" } });
          numberLine.appendChild(medM);
          numberLine.appendChild(el("div", { class: "nl-label", style: { left: (pad + medPct * usable + 20) + "px", color: "var(--accent)" }, text: "median" }));

          // Std band
          var lo = (DS.clamp(m - sd, mn, mx) - mn) / range;
          var hi = (DS.clamp(m + sd, mn, mx) - mn) / range;
          var band = el("div", { class: "nl-band", style: { left: (pad + lo * usable) + "px", width: ((hi - lo) * usable) + "px", background: "var(--brand)" } });
          numberLine.appendChild(band);
        }, 30);
      }

      var presetChips = el("div", { class: "chips" });
      presets.forEach(function (p) {
        var chip = el("span", { class: "chip", text: p.label });
        chip.addEventListener("click", function () {
          dataInput.value = p.data;
          updateStats();
        });
        presetChips.appendChild(chip);
      });

      dataInput.addEventListener("input", updateStats);

      root.appendChild(DS.widget("Center & Spread Explorer", "📏", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control", style: { flex: "1" } }, el("label", { text: "Data (comma-separated)" }), dataInput)
        ),
        el("div", { style: { marginTop: "8px" } }, el("label", { text: "Presets: ", style: { fontSize: ".78rem", color: "var(--muted)" } }), presetChips),
        statsRow, numberLine, errorMsg
      ));
      setTimeout(updateStats, 30);

      /* Distribution Shape */
      root.appendChild(el("h2", { text: "Distribution Shape" }));
      var distCanvas = el("canvas", { style: { height: "280px", width: "100%", background: "var(--bg-elev-2)", borderRadius: "var(--radius-sm)" } });
      var distBins = 12;

      function drawDist() {
        DS.chart(distCanvas, {
          type: "hist", data: DIST_DATA, bins: distBins,
          xLabel: "Value", yLabel: "Frequency"
        });
      }

      var distSlider = el("input", { type: "range", min: "4", max: "30", value: "12" });
      var distVal = el("span", { class: "val", text: "12" });
      distSlider.addEventListener("input", function () {
        distVal.textContent = distSlider.value;
        distBins = parseInt(distSlider.value);
        drawDist();
      });

      root.appendChild(DS.widget("Distribution Shape", "🔔", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Bins" }), distSlider, distVal)
        ),
        distCanvas
      ));
      setTimeout(drawDist, 80);

      /* Correlation Explorer */
      root.appendChild(el("h2", { text: "Correlation Explorer" }));
      root.appendChild(el("p", { text: "Pearson's r measures linear association: +1 = perfect positive, 0 = none, −1 = perfect negative." }));

      var corCanvas = el("canvas", { style: { height: "300px", width: "100%", background: "var(--bg-elev-2)", borderRadius: "var(--radius-sm)" } });
      var corR = 0.7;
      var corInfo = el("div", { class: "stat-row" });

      function drawCorrelation() {
        var ys = COR_XS.map(function (x, i) {
          return corR * x + Math.sqrt(Math.max(0, 1 - corR * corR)) * COR_NOISE[i];
        });
        var measuredR = DS.pearsonR(COR_XS, ys);
        var absR = Math.abs(measuredR);
        var strength = absR > 0.8 ? "Strong" : absR > 0.5 ? "Moderate" : absR > 0.2 ? "Weak" : "Very weak / none";
        var direction = measuredR > 0.05 ? "positive" : measuredR < -0.05 ? "negative" : "none";

        corInfo.innerHTML = "";
        corInfo.appendChild(el("div", { class: "stat-v" },
          el("div", { class: "s-val", text: DS.round(measuredR) }),
          el("div", { class: "s-lab", text: "Pearson r" })
        ));
        corInfo.appendChild(el("div", { class: "stat-v" },
          el("div", { class: "s-val", text: strength }),
          el("div", { class: "s-lab", text: "Strength" })
        ));
        corInfo.appendChild(el("div", { class: "stat-v" },
          el("div", { class: "s-val", text: direction }),
          el("div", { class: "s-lab", text: "Direction" })
        ));

        // Fit line
        var fit = DS.linearFit(COR_XS, ys);
        var xsSort = COR_XS.slice().sort(function (a, b) { return a - b; });
        var lineX = [xsSort[0], xsSort[xsSort.length - 1]];
        var lineY = lineX.map(function (x) { return fit.slope * x + fit.intercept; });

        DS.chart(corCanvas, {
          type: "scatter",
          series: [
            { x: COR_XS, y: ys, label: "Data" },
            { x: lineX, y: lineY, kind: "line", label: "Fit", markers: false, color: "var(--accent)" }
          ],
          xLabel: "x", yLabel: "y"
        });
      }

      var corSlider = el("input", { type: "range", min: "-100", max: "100", value: "70", style: { width: "260px" } });
      var corSliderVal = el("span", { class: "val", text: "0.70" });
      corSlider.addEventListener("input", function () {
        corR = parseInt(corSlider.value) / 100;
        corSliderVal.textContent = corR.toFixed(2);
        drawCorrelation();
      });

      root.appendChild(DS.widget("Correlation Explorer", "🔗", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Target r" }), corSlider, corSliderVal)
        ),
        corCanvas, corInfo
      ));
      setTimeout(drawCorrelation, 100);

      root.appendChild(DS.callout("warn", "⚠️ <strong>Correlation ≠ causation.</strong> Ice cream sales and drowning are correlated — but ice cream doesn't cause drowning. The hidden variable is summer heat."));

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Statistics Quiz",
        questions: [
          {
            q: "Which measure of center is most appropriate for skewed data?",
            options: ["Mean", "Median", "Mode", "Range"],
            answer: 1,
            explain: "The median is robust to outliers and skew, making it more representative of the 'typical' value."
          },
          {
            q: "A large standard deviation means the data is:",
            options: ["Clustered near the mean", "Widely spread out", "Normally distributed", "Skewed left"],
            answer: 1,
            explain: "Standard deviation measures spread. A large value means data points are far from the mean on average."
          },
          {
            q: "What does r = −0.9 indicate?",
            options: ["No relationship", "Weak positive correlation", "Strong negative correlation", "Causation"],
            answer: 2,
            explain: "|r| = 0.9 is very strong. The negative sign means as x increases, y decreases."
          },
          {
            q: "Correlation does NOT imply:",
            options: ["Association", "Linear relationship", "Causation", "Co-movement"],
            answer: 2,
            explain: "Correlation measures association, but cannot prove that one variable causes changes in another."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("statistics"));
      root.appendChild(DS.pageNav("statistics"));
    }
  });
})();
