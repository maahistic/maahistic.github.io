(function () {
  "use strict";
  var el = DS.el;

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  var REV = [12, 19, 15, 25, 22, 30];
  var SCORES = [];
  // ~50 fixed scores for histogram
  var _sr = DS.mulberry32(99999);
  for (var i = 0; i < 50; i++) SCORES.push(Math.round(40 + 50 * _sr()));
  var PIE_LABELS = ["Latte", "Mocha", "Tea", "Cold Brew"];
  var PIE_VALUES = [45, 25, 20, 10];

  DS.registerTopic({
    id: "matplotlib",
    title: "Matplotlib",
    icon: "📈",
    subtitle: "Visualization — from simple lines to full dashboards",
    order: 5,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "📈 Matplotlib" }));
      root.appendChild(el("p", { class: "section-intro", text: "Matplotlib is the most-used plotting library in Python. It gives you full control over every element of a chart." }));

      /* Simplest plot */
      root.appendChild(el("h2", { text: "Your first plot" }));
      root.appendChild(DS.runnable(
        "import matplotlib.pyplot as plt\n\nmonths = ['Jan','Feb','Mar','Apr','May','Jun']\nrevenue = [12, 19, 15, 25, 22, 30]\n\nplt.plot(months, revenue)\nplt.title('Monthly Revenue')\nplt.show()",
        "[Chart displayed — see the interactive widget below]"
      ));

      /* Figure Anatomy */
      root.appendChild(el("h2", { text: "Figure Anatomy" }));
      var showTitle = true, showAxLabels = true, showLegend = true, showMarkers = true, showGrid = true;
      var anatomyCanvas = el("canvas", { style: { height: "320px", width: "100%", background: "var(--bg-elev-2)", borderRadius: "var(--radius-sm)" } });

      function drawAnatomy() {
        if (typeof DS.mountChart === "function") {
          DS.mountChart(anatomyCanvas, function () {
            return {
              type: "line",
              categories: MONTHS,
              series: [
                { y: REV, label: "2023", markers: showMarkers },
                { y: [10, 15, 18, 20, 26, 28], label: "2024", markers: showMarkers }
              ],
              xLabel: showAxLabels ? "Month" : undefined,
              yLabel: showAxLabels ? "Revenue ($k)" : undefined,
              grid: showGrid
            };
          });
        } else {
          DS.chart(anatomyCanvas, {
            type: "line",
            categories: MONTHS,
            series: [
              { y: REV, label: "2023", markers: showMarkers },
              { y: [10, 15, 18, 20, 26, 28], label: "2024", markers: showMarkers }
            ],
            xLabel: showAxLabels ? "Month" : undefined,
            yLabel: showAxLabels ? "Revenue ($k)" : undefined,
            grid: showGrid
          });
        }
      }

      function makeToggle(label, checked, desc, onChange) {
        var cb = el("input", { type: "checkbox", checked: checked });
        cb.addEventListener("change", function () { onChange(cb.checked); drawAnatomy(); });
        return el("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" } },
          cb, el("strong", { text: label }), el("span", { text: " — " + desc, style: { fontSize: ".82rem", color: "var(--text-soft)" } })
        );
      }

      var toggles = el("div", { style: { marginTop: "12px" } },
        makeToggle("Title", true, "plt.title()", function (v) { showTitle = v; }),
        makeToggle("Axis labels", true, "plt.xlabel() / ylabel()", function (v) { showAxLabels = v; }),
        makeToggle("Legend", true, "plt.legend()", function (v) { showLegend = v; }),
        makeToggle("Markers", true, "marker='o'", function (v) { showMarkers = v; }),
        makeToggle("Gridlines", true, "plt.grid(True)", function (v) { showGrid = v; })
      );

      root.appendChild(DS.widget("Figure Anatomy", "🔬", "Interactive",
        anatomyCanvas, toggles
      ));
      setTimeout(drawAnatomy, 50);

      /* Chart Builder */
      root.appendChild(el("h2", { text: "Chart Builder" }));
      var chartType = "line";
      var chartTitle = "Monthly Revenue";
      var chartXLabel = "Month";
      var chartYLabel = "Revenue ($k)";
      var chartColor = null;
      var chartBins = 8;
      var builderCanvas = el("canvas", { style: { height: "320px", width: "100%", background: "var(--bg-elev-2)", borderRadius: "var(--radius-sm)" } });
      var builderCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".82rem", marginTop: "8px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap" } });
      var binsControl;

      function drawBuilder() {
        var spec = { type: chartType };
        var code = "import matplotlib.pyplot as plt\n\n";
        if (chartType === "line") {
          spec.categories = MONTHS; spec.series = [{ y: REV, color: chartColor }];
          spec.xLabel = chartXLabel; spec.yLabel = chartYLabel;
          code += "months = ['Jan','Feb','Mar','Apr','May','Jun']\nrev = [12,19,15,25,22,30]\nplt.plot(months, rev";
          if (chartColor) code += ", color='" + chartColor + "'";
          code += ")";
        } else if (chartType === "bar") {
          spec.categories = MONTHS; spec.series = [{ y: REV, color: chartColor }];
          spec.xLabel = chartXLabel; spec.yLabel = chartYLabel;
          code += "plt.bar(months, rev";
          if (chartColor) code += ", color='" + chartColor + "'";
          code += ")";
        } else if (chartType === "scatter") {
          spec.series = [{ y: REV, x: [0, 1, 2, 3, 4, 5], color: chartColor }];
          spec.xLabel = chartXLabel; spec.yLabel = chartYLabel;
          code += "plt.scatter(range(6), rev";
          if (chartColor) code += ", color='" + chartColor + "'";
          code += ")";
        } else if (chartType === "hist") {
          spec.data = SCORES; spec.bins = chartBins; spec.color = chartColor;
          spec.xLabel = chartXLabel; spec.yLabel = "Frequency";
          code += "scores = [" + SCORES.slice(0, 8).join(",") + ",...]\nplt.hist(scores, bins=" + chartBins;
          if (chartColor) code += ", color='" + chartColor + "'";
          code += ")";
        } else if (chartType === "pie") {
          spec.labels = PIE_LABELS; spec.values = PIE_VALUES;
          if (chartColor) spec.colors = [chartColor, "#0d9488", "#f59e0b", "#ef4444"];
          code += "plt.pie([45,25,20,10], labels=['Latte','Mocha','Tea','Cold Brew'], autopct='%1.0f%%')";
        }
        if (chartType !== "pie") {
          if (chartTitle) code += "\nplt.title('" + chartTitle + "')";
          if (chartXLabel) code += "\nplt.xlabel('" + chartXLabel + "')";
          if (chartYLabel) code += "\nplt.ylabel('" + chartYLabel + "')";
        } else {
          if (chartTitle) code += "\nplt.title('" + chartTitle + "')";
        }
        code += "\nplt.show()";
        builderCode.textContent = code;
        DS.chart(builderCanvas, spec);
        binsControl.style.display = chartType === "hist" ? "flex" : "none";
      }

      var typeChips = el("div", { class: "chips" });
      var typeEls = [];
      ["line", "bar", "scatter", "hist", "pie"].forEach(function (t) {
        var chip = el("span", { class: "chip" + (t === "line" ? " active" : ""), text: t });
        chip.addEventListener("click", function () {
          typeEls.forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          chartType = t;
          drawBuilder();
        });
        typeEls.push(chip);
        typeChips.appendChild(chip);
      });

      var titleInput = el("input", { type: "text", value: "Monthly Revenue", style: { width: "160px" } });
      titleInput.addEventListener("input", function () { chartTitle = titleInput.value; drawBuilder(); });
      var xlInput = el("input", { type: "text", value: "Month", style: { width: "100px" } });
      xlInput.addEventListener("input", function () { chartXLabel = xlInput.value; drawBuilder(); });
      var ylInput = el("input", { type: "text", value: "Revenue ($k)", style: { width: "100px" } });
      ylInput.addEventListener("input", function () { chartYLabel = ylInput.value; drawBuilder(); });

      var swatches = el("div", { style: { display: "flex", gap: "6px" } });
      var swatchColors = ["#4f46e5", "#0d9488", "#f59e0b", "#ef4444", "#8b5cf6"];
      swatchColors.forEach(function (c) {
        var sw = el("div", { class: "color-swatch", style: { background: c } });
        sw.addEventListener("click", function () {
          swatches.querySelectorAll(".color-swatch").forEach(function (s) { s.classList.remove("active"); });
          sw.classList.add("active");
          chartColor = c;
          drawBuilder();
        });
        swatches.appendChild(sw);
      });

      var binsSlider = el("input", { type: "range", min: "4", max: "20", value: "8" });
      var binsVal = el("span", { class: "val", text: "8" });
      binsSlider.addEventListener("input", function () { binsVal.textContent = binsSlider.value; chartBins = parseInt(binsSlider.value); drawBuilder(); });
      binsControl = el("div", { class: "control", style: { display: "none" } }, el("label", { text: "Bins" }), binsSlider, binsVal);

      root.appendChild(DS.widget("Chart Builder", "🎨", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Type" }), typeChips)
        ),
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Title" }), titleInput),
          el("div", { class: "control" }, el("label", { text: "X label" }), xlInput),
          el("div", { class: "control" }, el("label", { text: "Y label" }), ylInput),
          el("div", { class: "control" }, el("label", { text: "Color" }), swatches),
          binsControl
        ),
        builderCanvas, builderCode
      ));
      setTimeout(drawBuilder, 80);

      /* Which chart when */
      root.appendChild(el("h2", { text: "Which chart when?" }));
      var chartGuide = [
        { icon: "📈", title: "Line", desc: "Trends over time — sequential data" },
        { icon: "📊", title: "Bar", desc: "Compare categories — discrete groups" },
        { icon: "⚬", title: "Scatter", desc: "Relationships between two numeric variables" },
        { icon: "📉", title: "Histogram", desc: "Distribution shape of one variable" },
        { icon: "🥧", title: "Pie", desc: "Parts of a whole — use sparingly!" }
      ];
      var guideGrid = el("div", { class: "p-grid" });
      chartGuide.forEach(function (g) {
        guideGrid.appendChild(el("div", { class: "feat" },
          el("div", { class: "f-icon", text: g.icon }),
          el("div", { class: "f-title", text: g.title }),
          el("div", { class: "f-desc", text: g.desc })
        ));
      });
      root.appendChild(guideGrid);

      root.appendChild(DS.callout("tip", "<strong>Pro tip:</strong> Start simple. A clean line or bar chart communicates more than a flashy 3D visualization."));

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Matplotlib Quiz",
        questions: [
          {
            q: "Which chart type is best for showing trends over time?",
            options: ["Pie chart", "Line chart", "Scatter plot", "Histogram"],
            answer: 1,
            explain: "Line charts connect sequential points, making trends and changes over time easy to see."
          },
          {
            q: "What does plt.xlabel() do?",
            options: ["Sets the chart title", "Labels the x-axis", "Labels the y-axis", "Adds a legend"],
            answer: 1,
            explain: "plt.xlabel() sets the label text displayed along the x-axis."
          },
          {
            q: "When should you use a histogram?",
            options: ["To compare categories", "To show parts of a whole", "To see the distribution of one variable", "To show correlations"],
            answer: 2,
            explain: "Histograms bin a continuous variable and show frequency, revealing the shape of the distribution."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("matplotlib"));
      root.appendChild(DS.pageNav("matplotlib"));
    }
  });
})();
