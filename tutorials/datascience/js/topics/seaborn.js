(function () {
  "use strict";
  var el = DS.el;

  /* Generate tips data with seeded RNG */
  var R = DS.mulberry32(20240815);
  var TIPS = [];
  for (var i = 0; i < 40; i++) {
    var size = 1 + Math.floor(R() * 4);
    var day = ["Thur", "Fri", "Sat", "Sun"][Math.floor(R() * 4)];
    var time = R() < 0.5 ? "Lunch" : "Dinner";
    var total_bill = DS.round(2 + 8 * size + 4.5 * R() + 12 * R() * R(), 2);
    var tip = DS.round(total_bill * (0.15 + R() * 0.08 - R() * 0.05), 2);
    if (tip < 0.5) tip = 0.5;
    TIPS.push({ total_bill: total_bill, tip: tip, size: size, day: day, time: time });
  }

  DS.registerTopic({
    id: "seaborn",
    title: "Seaborn",
    icon: "🌊",
    subtitle: "Beautiful statistical charts — one line at a time",
    order: 7,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "🌊 Seaborn" }));
      root.appendChild(el("p", { class: "section-intro", text: "Seaborn is built on top of Matplotlib. It speaks Pandas, does statistics for you, and ships with beautiful defaults. Think of it as a \"point-and-shoot camera\" compared to Matplotlib's full manual SLR." }));

      /* Getting started */
      root.appendChild(el("h2", { text: "Getting started" }));
      root.appendChild(DS.runnable(
        "import seaborn as sns\nimport matplotlib.pyplot as plt\n\nsns.set_theme()  # beautiful defaults\ntips = sns.load_dataset('tips')\nsns.scatterplot(data=tips, x='total_bill', y='tip', hue='time')\nplt.show()",
        "[Scatter plot displayed — see the interactive gallery below]"
      ));

      /* Tips Sample Data */
      root.appendChild(el("h2", { text: "Tips Sample Data" }));
      root.appendChild(el("p", { text: "This is our seeded sample dataset (~40 rows). Here are the first 8 rows:" }));
      root.appendChild(DS.buildTable(TIPS.slice(0, 8), ["total_bill", "tip", "size", "day", "time"]));

      /* Plot Gallery */
      root.appendChild(el("h2", { text: "Seaborn Plot Gallery" }));
      root.appendChild(el("p", { text: "Click a chart type to see it rendered with the tips data, the one-line code, and what Seaborn does for you." }));

      var galleryCanvas = el("canvas", { style: { height: "300px", width: "100%", background: "var(--bg-elev-2)", borderRadius: "var(--radius-sm)" } });
      var galleryCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".82rem", marginTop: "8px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap" } });
      var galleryNote = el("div", { class: "callout tip", style: { marginTop: "8px" } });
      var heatmapArea = el("div", { style: { display: "none" } });
      var activeChart = "scatterplot";

      function drawGallery() {
        galleryCanvas.style.display = "block";
        heatmapArea.style.display = "none";

        if (activeChart === "scatterplot") {
          var lunch = TIPS.filter(function (t) { return t.time === "Lunch"; });
          var dinner = TIPS.filter(function (t) { return t.time === "Dinner"; });
          DS.chart(galleryCanvas, {
            type: "scatter",
            series: [
              { x: lunch.map(function (t) { return t.total_bill; }), y: lunch.map(function (t) { return t.tip; }), label: "Lunch", color: "var(--brand)" },
              { x: dinner.map(function (t) { return t.total_bill; }), y: dinner.map(function (t) { return t.tip; }), label: "Dinner", color: "var(--accent)" }
            ],
            xLabel: "total_bill", yLabel: "tip"
          });
          galleryCode.textContent = "sns.scatterplot(data=tips, x='total_bill', y='tip', hue='time')";
          galleryNote.innerHTML = "🎨 Seaborn automatically <strong>colors by group</strong> (hue) and adds a legend.";
        } else if (activeChart === "barplot") {
          var days = ["Thur", "Fri", "Sat", "Sun"];
          var means = days.map(function (d) {
            var vals = TIPS.filter(function (t) { return t.day === d; }).map(function (t) { return t.tip; });
            return vals.length ? DS.round(DS.mean(vals)) : 0;
          });
          DS.chart(galleryCanvas, {
            type: "bar", categories: days, series: [{ y: means }],
            xLabel: "day", yLabel: "mean tip"
          });
          galleryCode.textContent = "sns.barplot(data=tips, x='day', y='tip')";
          galleryNote.innerHTML = "📊 Seaborn computes the <strong>mean</strong> and adds confidence interval error bars automatically.";
        } else if (activeChart === "histplot") {
          DS.chart(galleryCanvas, {
            type: "hist", data: TIPS.map(function (t) { return t.total_bill; }), bins: 10,
            xLabel: "total_bill", yLabel: "Count"
          });
          galleryCode.textContent = "sns.histplot(data=tips, x='total_bill')";
          galleryNote.innerHTML = "🔔 Seaborn picks sensible bin widths and can optionally overlay a <strong>KDE curve</strong>.";
        } else if (activeChart === "lmplot") {
          // mean tip by size
          var sizes = [1, 2, 3, 4];
          var avgTip = sizes.map(function (s) {
            var vals = TIPS.filter(function (t) { return t.size === s; }).map(function (t) { return t.tip; });
            return vals.length ? DS.round(DS.mean(vals)) : 0;
          });
          DS.chart(galleryCanvas, {
            type: "line", categories: sizes.map(String),
            series: [{ y: avgTip, label: "Mean tip" }],
            xLabel: "Party size", yLabel: "Mean tip ($)"
          });
          galleryCode.textContent = "sns.lmplot(data=tips, x='size', y='tip')";
          galleryNote.innerHTML = "📈 lmplot fits a <strong>linear regression</strong> with a confidence band.";
        } else if (activeChart === "regplot") {
          var xs = TIPS.map(function (t) { return t.total_bill; });
          var ys = TIPS.map(function (t) { return t.tip; });
          var fit = DS.linearFit(xs, ys);
          var xsSort = xs.slice().sort(function (a, b) { return a - b; });
          var lineX = [xsSort[0], xsSort[xsSort.length - 1]];
          var lineY = lineX.map(function (x) { return fit.slope * x + fit.intercept; });
          DS.chart(galleryCanvas, {
            type: "scatter",
            series: [
              { x: xs, y: ys, label: "Data" },
              { x: lineX, y: lineY, kind: "line", label: "Fit", markers: false, color: "var(--accent)" }
            ],
            xLabel: "total_bill", yLabel: "tip"
          });
          galleryCode.textContent = "sns.regplot(data=tips, x='total_bill', y='tip')";
          galleryNote.innerHTML = "📐 regplot adds a <strong>regression line + confidence band</strong> to a scatter plot.";
        } else if (activeChart === "heatmap") {
          galleryCanvas.style.display = "none";
          heatmapArea.style.display = "block";
          // Compute correlation matrix
          var cols = ["total_bill", "tip", "size"];
          var matrix = [];
          cols.forEach(function (c1) {
            var row = [];
            cols.forEach(function (c2) {
              var a = TIPS.map(function (t) { return t[c1]; });
              var b = TIPS.map(function (t) { return t[c2]; });
              row.push(DS.round(DS.pearsonR(a, b), 2));
            });
            matrix.push(row);
          });

          heatmapArea.innerHTML = "";
          var grid = el("div", { class: "heatmap", style: { gridTemplateColumns: "80px repeat(" + cols.length + ", 64px)" } });
          // Header
          grid.appendChild(el("div", { class: "hm-label", text: "" }));
          cols.forEach(function (c) { grid.appendChild(el("div", { class: "hm-label", text: c })); });
          // Rows
          matrix.forEach(function (row, ri) {
            grid.appendChild(el("div", { class: "hm-label", text: cols[ri] }));
            row.forEach(function (val) {
              var c = DS.coolwarm(val);
              grid.appendChild(el("div", { class: "hm-cell", style: { background: c.bg, color: c.fg }, text: val.toFixed(2) }));
            });
          });
          heatmapArea.appendChild(grid);
          galleryCode.textContent = "sns.heatmap(tips[['total_bill','tip','size']].corr(), annot=True, cmap='coolwarm')";
          galleryNote.innerHTML = "🔥 Seaborn <strong>colors the matrix</strong> with a diverging colormap and annotates each cell.";
        }
      }

      var chartTypes = [
        { id: "scatterplot", label: "scatterplot" },
        { id: "barplot", label: "barplot" },
        { id: "histplot", label: "histplot" },
        { id: "lmplot", label: "lmplot" },
        { id: "regplot", label: "regplot" },
        { id: "heatmap", label: "heatmap" }
      ];
      var chartChips = el("div", { class: "chips" });
      var chartChipEls = [];
      chartTypes.forEach(function (ct) {
        var chip = el("span", { class: "chip" + (ct.id === "scatterplot" ? " active" : ""), text: ct.label });
        chip.addEventListener("click", function () {
          chartChipEls.forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          activeChart = ct.id;
          drawGallery();
        });
        chartChipEls.push(chip);
        chartChips.appendChild(chip);
      });

      root.appendChild(DS.widget("Seaborn Plot Gallery", "🖼️", "Interactive",
        chartChips, galleryCanvas, heatmapArea, galleryCode, galleryNote
      ));
      setTimeout(drawGallery, 100);

      /* Matplotlib vs Seaborn */
      root.appendChild(el("h2", { text: "Matplotlib vs Seaborn" }));
      root.appendChild(DS.tabs([
        {
          label: "Matplotlib (manual)",
          content: function () {
            return DS.runnable(
              "import matplotlib.pyplot as plt\n\nfor time_val in ['Lunch', 'Dinner']:\n    subset = tips[tips['time'] == time_val]\n    plt.scatter(subset['total_bill'], subset['tip'], label=time_val)\nplt.legend()\nplt.xlabel('total_bill')\nplt.ylabel('tip')\nplt.show()",
              "[Scatter plot with manual loop + legend]"
            );
          }
        },
        {
          label: "Seaborn (one line)",
          content: function () {
            return DS.runnable(
              "import seaborn as sns\n\nsns.scatterplot(data=tips, x='total_bill', y='tip', hue='time')",
              "[Same chart — one line!]"
            );
          }
        }
      ]));

      /* More one-liners */
      root.appendChild(el("h2", { text: "More Seaborn one-liners" }));
      root.appendChild(DS.tabs([
        {
          label: "boxplot",
          content: function () {
            return DS.runnable(
              "sns.boxplot(data=tips, x='day', y='total_bill')",
              "[Box plot showing distribution per day]"
            );
          }
        },
        {
          label: "violinplot",
          content: function () {
            return DS.runnable(
              "sns.violinplot(data=tips, x='day', y='total_bill')",
              "[Violin plot — KDE + box plot combined]"
            );
          }
        },
        {
          label: "pairplot",
          content: function () {
            return DS.runnable(
              "sns.pairplot(tips, hue='time')",
              "[Grid of scatter + histogram for every numeric pair]"
            );
          }
        },
        {
          label: "countplot",
          content: function () {
            return DS.runnable(
              "sns.countplot(data=tips, x='day', hue='time')",
              "[Grouped bar chart of counts per day/time]"
            );
          }
        }
      ]));

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Seaborn Quiz",
        questions: [
          {
            q: "What library is Seaborn built on top of?",
            options: ["NumPy", "Pandas", "Matplotlib", "Plotly"],
            answer: 2,
            explain: "Seaborn is a high-level interface built on top of Matplotlib."
          },
          {
            q: "What does the 'hue' parameter do?",
            options: ["Changes the chart background", "Adjusts the brightness", "Colors data points by a categorical variable", "Filters the data"],
            answer: 2,
            explain: "hue= splits data by a category and assigns each group a different color."
          },
          {
            q: "Which Seaborn function adds a regression line to a scatter plot?",
            options: ["sns.scatterplot", "sns.barplot", "sns.regplot", "sns.histplot"],
            answer: 2,
            explain: "sns.regplot() draws scatter points plus a fitted regression line with confidence band."
          },
          {
            q: "What does a heatmap of .corr() show?",
            options: ["Raw data values", "Missing data locations", "Pairwise correlation coefficients", "Data types"],
            answer: 2,
            explain: "A heatmap of the correlation matrix shows how strongly each pair of numeric columns is linearly related."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("seaborn"));
      root.appendChild(DS.pageNav("seaborn"));
    }
  });
})();
