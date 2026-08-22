(function () {
  "use strict";
  var el = DS.el;

  DS.registerTopic({
    id: "numpy",
    title: "NumPy",
    icon: "🔢",
    subtitle: "Fast numeric arrays — the foundation",
    order: 3,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "🔢 NumPy" }));
      root.appendChild(el("p", { class: "section-intro", text: "NumPy (Numerical Python) gives you fast, memory-efficient arrays and vectorized operations. It's the foundation that Pandas, Matplotlib, and scikit-learn are all built on." }));

      /* Why not a list */
      root.appendChild(el("h2", { text: "Why not a plain Python list?" }));
      root.appendChild(DS.tabs([
        {
          label: "Plain Python loop",
          content: function () {
            return DS.runnable(
              '# Multiply every element by 2 — Python list\ndata = [1, 2, 3, 4, 5]\nresult = []\nfor x in data:\n    result.append(x * 2)\nprint(result)  # [2, 4, 6, 8, 10]',
              "[2, 4, 6, 8, 10]"
            );
          }
        },
        {
          label: "Vectorized NumPy",
          content: function () {
            return DS.runnable(
              'import numpy as np\n\ndata = np.array([1, 2, 3, 4, 5])\nresult = data * 2       # no loop needed!\nprint(result)  # [ 2  4  6  8 10]',
              "[ 2  4  6  8 10]"
            );
          }
        }
      ]));

      /* Creating arrays */
      root.appendChild(el("h2", { text: "Creating arrays" }));
      root.appendChild(DS.runnable(
        'import numpy as np\n\na = np.array([1, 2, 3])\nb = np.zeros(4)\nc = np.arange(0, 10, 2)\nd = np.linspace(0, 1, 5)\n\nprint(a)  # [1 2 3]\nprint(b)  # [0. 0. 0. 0.]\nprint(c)  # [0 2 4 6 8]\nprint(d)  # [0.   0.25 0.5  0.75 1.  ]',
        "[1 2 3]\n[0. 0. 0. 0.]\n[0 2 4 6 8]\n[0.   0.25 0.5  0.75 1.  ]"
      ));

      /* Shape Explorer */
      root.appendChild(el("h2", { text: "Shape Explorer" }));
      var shapeRows, shapeCols, shapeGrid, shapeInfo;
      function updateShape() {
        var r = parseInt(shapeRows.value, 10);
        var c = parseInt(shapeCols.value, 10);
        shapeGrid.innerHTML = "";
        shapeGrid.style.gridTemplateColumns = "repeat(" + c + ", 46px)";
        var val = 0;
        for (var i = 0; i < r; i++) {
          for (var j = 0; j < c; j++) {
            shapeGrid.appendChild(el("div", { class: "np-cell", text: val++ }));
          }
        }
        shapeInfo.textContent = "shape: (" + r + ", " + c + ")  ndim: 2  size: " + (r * c) + "  dtype: int64";
      }
      shapeRows = el("input", { type: "range", min: "1", max: "6", value: "3" });
      shapeCols = el("input", { type: "range", min: "1", max: "6", value: "4" });
      var rVal = el("span", { class: "val", text: "3" });
      var cVal = el("span", { class: "val", text: "4" });
      shapeRows.addEventListener("input", function () { rVal.textContent = shapeRows.value; updateShape(); });
      shapeCols.addEventListener("input", function () { cVal.textContent = shapeCols.value; updateShape(); });
      shapeGrid = el("div", { class: "np-grid" });
      shapeInfo = el("div", { class: "np-result" });
      root.appendChild(DS.widget("Shape Explorer", "📐", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Rows" }), shapeRows, rVal),
          el("div", { class: "control" }, el("label", { text: "Cols" }), shapeCols, cVal)
        ),
        shapeGrid, shapeInfo
      ));
      updateShape();

      /* Slicing Playground */
      root.appendChild(el("h2", { text: "Slicing Playground" }));
      root.appendChild(el("p", { text: "The array below is np.arange(20).reshape(4, 5). Type a NumPy-style slice to select cells." }));

      var MATRIX = [];
      for (var i = 0; i < 4; i++) {
        MATRIX.push([]);
        for (var j = 0; j < 5; j++) MATRIX[i].push(i * 5 + j);
      }

      var sliceInput = el("input", { type: "text", value: "1:3, 1:4", style: { width: "200px" } });
      var sliceGrid = el("div", { class: "np-grid", style: { gridTemplateColumns: "repeat(5, 46px)" } });
      var sliceResult = el("div", { class: "np-result" });
      var sliceError = el("div", { class: "error-msg" });

      function renderSlice() {
        sliceGrid.innerHTML = "";
        sliceError.textContent = "";
        sliceResult.textContent = "";
        var input = sliceInput.value.trim();

        // Parse axes
        var parts;
        if (input.startsWith("[") || input.startsWith("a[")) {
          var inner = input.replace(/^a?\[/, "").replace(/\]$/, "");
          parts = inner.split(",");
        } else {
          parts = input.split(",");
        }
        if (parts.length > 2) { sliceError.textContent = "Too many dimensions (max 2 for a 4×5 array)"; renderPlainGrid(); return; }

        try {
          var rowSpec = DS.parseSlice(parts[0]);
          var colSpec = parts.length > 1 ? DS.parseSlice(parts[1]) : { type: "slice", start: null, stop: null, step: 1 };

          var selectedRows, selectedCols;
          var dropRow = false, dropCol = false;

          if (rowSpec.type === "index") {
            var ri = rowSpec.value < 0 ? rowSpec.value + 4 : rowSpec.value;
            if (ri < 0 || ri >= 4) throw "row index out of bounds";
            selectedRows = [ri]; dropRow = true;
          } else {
            selectedRows = DS.adjustSlice(4, rowSpec.start, rowSpec.stop, rowSpec.step);
          }

          if (colSpec.type === "index") {
            var ci = colSpec.value < 0 ? colSpec.value + 5 : colSpec.value;
            if (ci < 0 || ci >= 5) throw "column index out of bounds";
            selectedCols = [ci]; dropCol = true;
          } else {
            selectedCols = DS.adjustSlice(5, colSpec.start, colSpec.stop, colSpec.step);
          }

          var activeSet = {};
          selectedRows.forEach(function (r) {
            selectedCols.forEach(function (c) {
              activeSet[r + "," + c] = true;
            });
          });

          // Render grid
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 5; c++) {
              var isActive = activeSet[r + "," + c];
              sliceGrid.appendChild(el("div", {
                class: "np-cell" + (isActive ? " active" : ""),
                text: MATRIX[r][c]
              }));
            }
          }

          // Build result
          var result = [];
          selectedRows.forEach(function (r) {
            var row = [];
            selectedCols.forEach(function (c) { row.push(MATRIX[r][c]); });
            result.push(row);
          });

          // Shape
          var shape;
          if (dropRow && dropCol) {
            shape = "()" ;
            sliceResult.textContent = "Result: " + result[0][0] + "    shape: scalar";
          } else if (dropRow) {
            shape = "(" + selectedCols.length + ",)";
            sliceResult.textContent = "Result: [" + result[0].join(", ") + "]    shape: " + shape;
          } else if (dropCol) {
            shape = "(" + selectedRows.length + ",)";
            var flat = result.map(function (r) { return r[0]; });
            sliceResult.textContent = "Result: [" + flat.join(", ") + "]    shape: " + shape;
          } else {
            shape = "(" + selectedRows.length + ", " + selectedCols.length + ")";
            var rows = result.map(function (r) { return "[" + r.join(", ") + "]"; });
            sliceResult.textContent = "Result: [" + rows.join(", ") + "]    shape: " + shape;
          }
        } catch (e) {
          sliceError.textContent = "Error: " + e;
          renderPlainGrid();
        }
      }

      function renderPlainGrid() {
        sliceGrid.innerHTML = "";
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 5; c++) {
            sliceGrid.appendChild(el("div", { class: "np-cell", text: MATRIX[r][c] }));
          }
        }
      }

      sliceInput.addEventListener("input", renderSlice);
      var sliceControls = el("div", { class: "controls" },
        el("div", { class: "control" },
          el("label", { text: "a[...]" }),
          sliceInput
        )
      );
      root.appendChild(DS.widget("Slicing Playground", "✂️", "Interactive",
        sliceControls, sliceGrid, sliceResult, sliceError
      ));
      renderSlice();

      /* Element-wise math */
      root.appendChild(el("h2", { text: "Element-wise math" }));
      root.appendChild(DS.runnable(
        'import numpy as np\n\na = np.array([10, 20, 30, 40, 50])\nprint(a + 5)     # [15 25 35 45 55]\nprint(a * 2)     # [ 20  40  60  80 100]\nprint(a > 25)    # [False False  True  True  True]\nprint(np.sqrt(a))',
        "[15 25 35 45 55]\n[ 20  40  60  80 100]\n[False False  True  True  True]\n[3.16227766 4.47213595 5.47722558 6.32455532 7.07106781]"
      ));

      /* Axis Aggregator */
      root.appendChild(el("h2", { text: "Axis Aggregator" }));

      var axisOp, axisChips;
      var axisGrid = el("div", { class: "np-grid", style: { gridTemplateColumns: "repeat(5, 46px)" } });
      var axisResult = el("div", { class: "np-result" });
      var axisCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".85rem", marginTop: "6px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)" } });
      var currentAxis = null; // null, 0, 1

      function updateAxis() {
        axisGrid.innerHTML = "";
        for (var r = 0; r < 4; r++) {
          for (var c = 0; c < 5; c++) {
            axisGrid.appendChild(el("div", { class: "np-cell", text: MATRIX[r][c] }));
          }
        }

        var op = axisOp.value;
        var result, shape, caption;

        if (currentAxis === null) {
          // no axis — flatten
          var flat = [];
          MATRIX.forEach(function (r) { r.forEach(function (v) { flat.push(v); }); });
          if (op === "sum") result = DS.sum(flat);
          else if (op === "mean") result = DS.round(DS.mean(flat));
          else result = Math.max.apply(null, flat);
          shape = "scalar";
          caption = op + " of all elements → single number";
          axisCode.textContent = "a." + op + "()  →  " + result;
          axisResult.textContent = "Result: " + result + "    shape: " + shape + "\n" + caption;
        } else if (currentAxis === 0) {
          // collapse rows
          var cols = [];
          for (var c = 0; c < 5; c++) {
            var col = [];
            for (var r = 0; r < 4; r++) col.push(MATRIX[r][c]);
            if (op === "sum") cols.push(DS.sum(col));
            else if (op === "mean") cols.push(DS.round(DS.mean(col)));
            else cols.push(Math.max.apply(null, col));
          }
          shape = "(5,)";
          caption = "Collapse rows ↓ — one result per column";
          axisCode.textContent = "a." + op + "(axis=0)  →  [" + cols.join(", ") + "]";
          axisResult.textContent = "Result: [" + cols.join(", ") + "]    shape: " + shape + "\n" + caption;
        } else {
          // collapse cols
          var rows = [];
          for (var r = 0; r < 4; r++) {
            if (op === "sum") rows.push(DS.sum(MATRIX[r]));
            else if (op === "mean") rows.push(DS.round(DS.mean(MATRIX[r])));
            else rows.push(Math.max.apply(null, MATRIX[r]));
          }
          shape = "(4,)";
          caption = "Collapse columns → — one result per row";
          axisCode.textContent = "a." + op + "(axis=1)  →  [" + rows.join(", ") + "]";
          axisResult.textContent = "Result: [" + rows.join(", ") + "]    shape: " + shape + "\n" + caption;
        }
      }

      axisOp = el("select", null,
        el("option", { value: "sum", text: "sum" }),
        el("option", { value: "mean", text: "mean" }),
        el("option", { value: "max", text: "max" })
      );
      axisOp.addEventListener("change", updateAxis);

      var axisOptions = [
        { label: "None (flatten)", value: null },
        { label: "0 ↓ (collapse rows)", value: 0 },
        { label: "1 → (collapse cols)", value: 1 }
      ];
      var chipEls = [];
      var axisChipWrap = el("div", { class: "chips" });
      axisOptions.forEach(function (opt, i) {
        var chip = el("span", { class: "chip" + (i === 0 ? " active" : ""), text: opt.label });
        chip.addEventListener("click", function () {
          chipEls.forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
          currentAxis = opt.value;
          updateAxis();
        });
        chipEls.push(chip);
        axisChipWrap.appendChild(chip);
      });

      root.appendChild(DS.widget("Axis Aggregator", "📏", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Operation" }), axisOp),
          el("div", { class: "control" }, el("label", { text: "Axis" }), axisChipWrap)
        ),
        axisGrid, axisCode, axisResult
      ));
      updateAxis();

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "NumPy Quiz",
        questions: [
          {
            q: "What does np.arange(20).reshape(4,5) create?",
            options: ["A list of 20 items", "A 4×5 matrix with values 0-19", "A 5×4 matrix", "A 20×1 vector"],
            answer: 1,
            explain: "arange(20) creates [0..19], reshape(4,5) arranges them into 4 rows × 5 columns."
          },
          {
            q: "Given a 4×5 matrix, what does a.sum(axis=0) produce?",
            options: ["A single number", "An array of 4 values (one per row)", "An array of 5 values (one per column)", "A 4×5 matrix"],
            answer: 2,
            explain: "axis=0 collapses rows, leaving one sum per column → 5 values."
          },
          {
            q: "What is a[:, 2] on a 4×5 array?",
            options: ["Row 2", "Column 2 (4 values)", "A 2×5 slice", "An error"],
            answer: 1,
            explain: "[:, 2] means 'all rows, column index 2' → a 1D array of 4 values."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("numpy"));
      root.appendChild(DS.pageNav("numpy"));
    }
  });
})();
