(function () {
  "use strict";
  var el = DS.el;

  /* ===== Exact coffee dataset ===== */
  var DATA = [
    { region: "North", product: "Latte", units: 30, price: 3.5 },
    { region: "North", product: "Mocha", units: 20, price: 4.0 },
    { region: "South", product: "Latte", units: 45, price: 3.5 },
    { region: "South", product: "Tea",   units: 15, price: 2.5 },
    { region: "East",  product: "Mocha", units: 25, price: 4.0 },
    { region: "East",  product: "Latte", units: 35, price: 3.5 },
    { region: "North", product: "Tea",   units: 40, price: 2.5 },
    { region: "South", product: "Mocha", units: 22, price: 4.0 },
    { region: "East",  product: "Tea",   units: 18, price: 2.5 }
  ];
  DATA.forEach(function (r) { r.revenue = DS.round(r.units * r.price, 2); });

  /* ===== Exact orders for crosstab ===== */
  var ORDERS = [
    { day_part: "Morning", drink: "Latte", spend: 4.0 },
    { day_part: "Morning", drink: "Latte", spend: 4.0 },
    { day_part: "Morning", drink: "Latte", spend: 5.0 },
    { day_part: "Morning", drink: "Mocha", spend: 4.5 },
    { day_part: "Morning", drink: "Tea",   spend: 3.0 },
    { day_part: "Morning", drink: "Latte", spend: 4.5 },
    { day_part: "Afternoon", drink: "Tea",   spend: 3.5 },
    { day_part: "Afternoon", drink: "Tea",   spend: 3.0 },
    { day_part: "Afternoon", drink: "Mocha", spend: 4.0 },
    { day_part: "Afternoon", drink: "Latte", spend: 4.5 },
    { day_part: "Afternoon", drink: "Tea",   spend: 3.5 },
    { day_part: "Afternoon", drink: "Mocha", spend: 4.5 }
  ];

  DS.registerTopic({
    id: "pandas",
    title: "Pandas",
    icon: "🐼",
    subtitle: "DataFrames — filter, group, aggregate tabular data",
    order: 4,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "🐼 Pandas" }));
      root.appendChild(el("p", { class: "section-intro", text: "Pandas gives you the DataFrame — a powerful 2D table with labeled rows and columns. Think of it as a programmable spreadsheet." }));

      /* Series vs DataFrame */
      root.appendChild(el("h2", { text: "Series vs DataFrame" }));
      root.appendChild(DS.runnable(
        'import pandas as pd\n\n# Series — a single column\ns = pd.Series([10, 20, 30], name="sales")\nprint(s)\n\n# DataFrame — a table\ndf = pd.DataFrame({\n    "product": ["Latte", "Mocha", "Tea"],\n    "units": [30, 20, 15]\n})\nprint(df)',
        "0    10\n1    20\n2    30\nName: sales, dtype: int64\n\n  product  units\n0   Latte     30\n1   Mocha     20\n2     Tea     15"
      ));

      /* Sample dataset */
      root.appendChild(el("h2", { text: "Our coffee-shop dataset" }));
      root.appendChild(el("p", { text: "We'll use this 9-row dataset throughout the Pandas section:" }));
      root.appendChild(DS.buildTable(DATA, ["region", "product", "units", "price", "revenue"]));

      /* DataFrame Explorer */
      root.appendChild(el("h2", { text: "DataFrame Explorer" }));

      var allCols = ["region", "product", "units", "price", "revenue"];
      var visibleCols = allCols.slice();
      var filterEnabled = false;
      var filterCol = "units";
      var filterOp = ">";
      var filterVal = "30";
      var sortCol = null;
      var sortAsc = true;
      var explorerOutput = el("div");
      var explorerCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".82rem", marginTop: "8px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap" } });

      function updateExplorer() {
        var rows = DATA.slice();
        var codeParts = ["result = df"];
        if (filterEnabled) {
          var v = parseFloat(filterVal);
          if (!isNaN(v)) {
            rows = rows.filter(function (r) {
              var rv = r[filterCol];
              if (filterOp === ">") return rv > v;
              if (filterOp === ">=") return rv >= v;
              if (filterOp === "<") return rv < v;
              if (filterOp === "<=") return rv <= v;
              return rv === v;
            });
            codeParts.push("result = result[result['" + filterCol + "'] " + filterOp + " " + filterVal + "]");
          }
        }
        if (sortCol) {
          rows.sort(function (a, b) {
            return sortAsc ? (a[sortCol] > b[sortCol] ? 1 : -1) : (a[sortCol] < b[sortCol] ? 1 : -1);
          });
          codeParts.push("result = result.sort_values('" + sortCol + "'" + (sortAsc ? "" : ", ascending=False") + ")");
        }
        if (visibleCols.length < allCols.length) {
          codeParts.push("result = result[['" + visibleCols.join("', '") + "']]");
        }
        explorerOutput.innerHTML = "";
        explorerOutput.appendChild(DS.buildTable(rows, visibleCols, {
          onSort: function (col) {
            if (sortCol === col) sortAsc = !sortAsc;
            else { sortCol = col; sortAsc = true; }
            updateExplorer();
          }
        }));
        explorerCode.textContent = codeParts.join("\n");
      }

      // Column chips
      var colChips = el("div", { class: "chips" });
      allCols.forEach(function (col) {
        var chip = el("span", { class: "chip active", text: col });
        chip.addEventListener("click", function () {
          chip.classList.toggle("active");
          if (chip.classList.contains("active")) {
            if (visibleCols.indexOf(col) === -1) visibleCols.push(col);
          } else {
            visibleCols = visibleCols.filter(function (c) { return c !== col; });
          }
          visibleCols.sort(function (a, b) { return allCols.indexOf(a) - allCols.indexOf(b); });
          updateExplorer();
        });
        colChips.appendChild(chip);
      });

      // Filter row
      var fCheck = el("input", { type: "checkbox" });
      var fColSel = el("select");
      ["units", "price", "revenue"].forEach(function (c) { fColSel.appendChild(el("option", { value: c, text: c })); });
      var fOpSel = el("select");
      [">", ">=", "<", "<=", "=="].forEach(function (op) { fOpSel.appendChild(el("option", { value: op, text: op })); });
      var fValInput = el("input", { type: "text", value: "30", style: { width: "60px" } });

      fCheck.addEventListener("change", function () { filterEnabled = fCheck.checked; updateExplorer(); });
      fColSel.addEventListener("change", function () { filterCol = fColSel.value; updateExplorer(); });
      fOpSel.addEventListener("change", function () { filterOp = fOpSel.value; updateExplorer(); });
      fValInput.addEventListener("input", function () { filterVal = fValInput.value; updateExplorer(); });

      var filterRow = el("div", { class: "filter-row" },
        fCheck,
        el("label", { text: "Filter:" }),
        fColSel, fOpSel, fValInput
      );

      root.appendChild(DS.widget("DataFrame Explorer", "🔍", "Interactive",
        el("div", null, el("label", { text: "Columns: ", style: { fontSize: ".82rem", fontWeight: "600", color: "var(--muted)" } }), colChips),
        filterRow, explorerOutput, explorerCode
      ));
      updateExplorer();

      /* GroupBy Builder */
      root.appendChild(el("h2", { text: "GroupBy Builder" }));

      var gbGroup = "region", gbCol = "revenue";
      var gbFuncs = ["sum"];
      var gbOutput = el("div");
      var gbCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".82rem", marginTop: "8px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap" } });

      function updateGroupby() {
        var groups = {};
        DATA.forEach(function (r) {
          var key = r[gbGroup];
          if (!groups[key]) groups[key] = [];
          groups[key].push(r[gbCol]);
        });

        var resultRows = [];
        Object.keys(groups).sort().forEach(function (key) {
          var row = {};
          row[gbGroup] = key;
          gbFuncs.forEach(function (fn) {
            var vals = groups[key];
            var res;
            if (fn === "sum") res = DS.sum(vals);
            else if (fn === "mean") res = DS.round(DS.mean(vals));
            else if (fn === "count") res = vals.length;
            else if (fn === "max") res = Math.max.apply(null, vals);
            else if (fn === "min") res = Math.min.apply(null, vals);
            else if (fn === "std") res = DS.round(DS.std(vals, false));
            row[fn] = res;
          });
          resultRows.push(row);
        });

        gbOutput.innerHTML = "";
        gbOutput.appendChild(DS.buildTable(resultRows, [gbGroup].concat(gbFuncs)));

        if (gbFuncs.length === 1) {
          gbCode.textContent = "df.groupby('" + gbGroup + "')['" + gbCol + "']." + gbFuncs[0] + "()";
        } else {
          gbCode.textContent = "df.groupby('" + gbGroup + "')['" + gbCol + "'].agg(['" + gbFuncs.join("', '") + "'])";
        }
      }

      var gbGroupSel = el("select");
      ["region", "product"].forEach(function (c) { gbGroupSel.appendChild(el("option", { value: c, text: c })); });
      gbGroupSel.addEventListener("change", function () { gbGroup = gbGroupSel.value; updateGroupby(); });

      var gbColSel = el("select");
      ["revenue", "units", "price"].forEach(function (c) { gbColSel.appendChild(el("option", { value: c, text: c })); });
      gbColSel.addEventListener("change", function () { gbCol = gbColSel.value; updateGroupby(); });

      var gbFuncChips = el("div", { class: "chips" });
      var allFuncs = ["sum", "mean", "min", "max", "count", "std"];
      var funcChipEls = [];
      allFuncs.forEach(function (fn) {
        var chip = el("span", { class: "chip" + (fn === "sum" ? " active" : ""), text: fn });
        chip.addEventListener("click", function () {
          chip.classList.toggle("active");
          gbFuncs = [];
          funcChipEls.forEach(function (c, i) {
            if (c.classList.contains("active")) gbFuncs.push(allFuncs[i]);
          });
          if (gbFuncs.length === 0) { chip.classList.add("active"); gbFuncs.push(fn); }
          updateGroupby();
        });
        funcChipEls.push(chip);
        gbFuncChips.appendChild(chip);
      });

      root.appendChild(DS.widget("GroupBy Builder", "📊", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Group by" }), gbGroupSel),
          el("div", { class: "control" }, el("label", { text: "Column" }), gbColSel),
          el("div", { class: "control" }, el("label", { text: "Functions" }), gbFuncChips)
        ),
        gbOutput, gbCode
      ));
      updateGroupby();

      /* Three ways tabs */
      root.appendChild(DS.tabs([
        {
          label: "List of funcs",
          content: function () {
            return DS.runnable(
              "df.groupby('region')['revenue'].agg(['sum', 'mean', 'std'])",
              "         sum    mean      std\nregion\nEast   267.5  89.17   39.87\nNorth  285.0  95.00   13.23\nSouth  283.0  94.33   60.25"
            );
          }
        },
        {
          label: "Dict per column",
          content: function () {
            return DS.runnable(
              "df.groupby('region').agg({\n    'revenue': 'sum',\n    'units': 'mean'\n})",
              "         revenue  units\nregion\nEast      267.5  26.00\nNorth     285.0  30.00\nSouth     283.0  27.33"
            );
          }
        },
        {
          label: "Named aggregation",
          content: function () {
            return DS.runnable(
              "df.groupby('region').agg(\n    total_rev=('revenue', 'sum'),\n    avg_units=('units', 'mean')\n)",
              "         total_rev  avg_units\nregion\nEast        267.5      26.00\nNorth       285.0      30.00\nSouth       283.0      27.33"
            );
          }
        }
      ]));

      /* Cross-tabulation */
      root.appendChild(el("h2", { text: "Cross-tabulation" }));
      root.appendChild(el("p", { text: "pd.crosstab() creates a frequency table showing how often combinations of categories appear." }));

      root.appendChild(DS.runnable(
        "orders = pd.DataFrame([\n    {'day_part':'Morning','drink':'Latte','spend':4.0},\n    {'day_part':'Morning','drink':'Latte','spend':4.0},\n    {'day_part':'Morning','drink':'Latte','spend':5.0},\n    {'day_part':'Morning','drink':'Mocha','spend':4.5},\n    {'day_part':'Morning','drink':'Tea','spend':3.0},\n    {'day_part':'Morning','drink':'Latte','spend':4.5},\n    {'day_part':'Afternoon','drink':'Tea','spend':3.5},\n    {'day_part':'Afternoon','drink':'Tea','spend':3.0},\n    {'day_part':'Afternoon','drink':'Mocha','spend':4.0},\n    {'day_part':'Afternoon','drink':'Latte','spend':4.5},\n    {'day_part':'Afternoon','drink':'Tea','spend':3.5},\n    {'day_part':'Afternoon','drink':'Mocha','spend':4.5},\n])\npd.crosstab(orders['day_part'], orders['drink'])",
        "drink      Latte  Mocha  Tea\nday_part\nAfternoon      1      2    3\nMorning        4      1    1"
      ));

      /* Crosstab Builder */
      var ctRows = "day_part", ctCols = "drink", ctMode = "count", ctMargins = false;
      var ctOutput = el("div");
      var ctCode = el("div", { class: "np-result", style: { fontFamily: "var(--font-mono)", fontSize: ".82rem", marginTop: "8px", background: "var(--code-bg)", color: "var(--code-text)", padding: "10px 14px", borderRadius: "var(--radius-sm)", whiteSpace: "pre-wrap" } });

      function updateCrosstab() {
        var rowKey = ctRows, colKey = ctCols;
        var rowVals = []; var colVals = [];
        ORDERS.forEach(function (o) {
          if (rowVals.indexOf(o[rowKey]) === -1) rowVals.push(o[rowKey]);
          if (colVals.indexOf(o[colKey]) === -1) colVals.push(o[colKey]);
        });
        rowVals.sort(); colVals.sort();

        // Build cross-table
        var table = {};
        rowVals.forEach(function (rv) {
          table[rv] = {};
          colVals.forEach(function (cv) { table[rv][cv] = []; });
        });
        ORDERS.forEach(function (o) {
          table[o[rowKey]][o[colKey]].push(o.spend);
        });

        // Compute cell values
        var displayRows = [];
        rowVals.forEach(function (rv) {
          var row = {};
          row[rowKey] = rv;
          colVals.forEach(function (cv) {
            var vals = table[rv][cv];
            if (ctMode === "count") row[cv] = vals.length;
            else if (ctMode === "mean") row[cv] = vals.length ? DS.round(DS.mean(vals)) : 0;
            else row[cv] = DS.round(DS.sum(vals.map(function (v) { return v; })));
          });
          displayRows.push(row);
        });

        // Margins
        if (ctMargins) {
          // Row totals (All column)
          displayRows.forEach(function (row) {
            // Compute from underlying raw data
            var allVals = [];
            colVals.forEach(function (cv) {
              allVals = allVals.concat(table[row[rowKey]][cv]);
            });
            if (ctMode === "count") row["All"] = allVals.length;
            else if (ctMode === "mean") row["All"] = allVals.length ? DS.round(DS.mean(allVals)) : 0;
            else row["All"] = DS.round(DS.sum(allVals));
          });

          // Column totals (All row)
          var allRow = {};
          allRow[rowKey] = "All";
          colVals.forEach(function (cv) {
            var allVals = [];
            rowVals.forEach(function (rv) {
              allVals = allVals.concat(table[rv][cv]);
            });
            if (ctMode === "count") allRow[cv] = allVals.length;
            else if (ctMode === "mean") allRow[cv] = allVals.length ? DS.round(DS.mean(allVals)) : 0;
            else allRow[cv] = DS.round(DS.sum(allVals));
          });
          // Grand total
          var grandVals = [];
          ORDERS.forEach(function (o) { grandVals.push(o.spend); });
          if (ctMode === "count") allRow["All"] = grandVals.length;
          else if (ctMode === "mean") allRow["All"] = grandVals.length ? DS.round(DS.mean(grandVals)) : 0;
          else allRow["All"] = DS.round(DS.sum(grandVals));

          displayRows.push(allRow);
        }

        var displayCols = [rowKey].concat(colVals);
        if (ctMargins) displayCols.push("All");

        ctOutput.innerHTML = "";
        ctOutput.appendChild(DS.buildTable(displayRows, displayCols, { showIndex: false }));

        var codeStr = "pd.crosstab(orders['" + rowKey + "'], orders['" + colKey + "']";
        if (ctMode === "mean") codeStr += ", values=orders['spend'], aggfunc='mean'";
        else if (ctMode === "sum") codeStr += ", values=orders['spend'], aggfunc='sum'";
        if (ctMargins) codeStr += ", margins=True";
        codeStr += ")";
        ctCode.textContent = codeStr;
      }

      var ctRowSel = el("select");
      ["day_part", "drink"].forEach(function (c) { ctRowSel.appendChild(el("option", { value: c, text: c })); });
      ctRowSel.addEventListener("change", function () { ctRows = ctRowSel.value; updateCrosstab(); });
      var ctColSel = el("select");
      ["drink", "day_part"].forEach(function (c) { ctColSel.appendChild(el("option", { value: c, text: c })); });
      ctColSel.addEventListener("change", function () { ctCols = ctColSel.value; updateCrosstab(); });
      var ctModeSel = el("select");
      [["count", "count"], ["mean", "mean of spend"], ["sum", "sum of spend"]].forEach(function (c) { ctModeSel.appendChild(el("option", { value: c[0], text: c[1] })); });
      ctModeSel.addEventListener("change", function () { ctMode = ctModeSel.value; updateCrosstab(); });
      var ctMarginCheck = el("input", { type: "checkbox" });
      ctMarginCheck.addEventListener("change", function () { ctMargins = ctMarginCheck.checked; updateCrosstab(); });

      root.appendChild(DS.widget("Crosstab Builder", "📋", "Interactive",
        el("div", { class: "controls" },
          el("div", { class: "control" }, el("label", { text: "Rows" }), ctRowSel),
          el("div", { class: "control" }, el("label", { text: "Cols" }), ctColSel),
          el("div", { class: "control" }, el("label", { text: "Cells" }), ctModeSel),
          el("div", { class: "control" }, el("label", null, ctMarginCheck, " margins=True"))
        ),
        ctOutput, ctCode
      ));
      updateCrosstab();

      /* Normalize runnable */
      root.appendChild(DS.runnable(
        "pd.crosstab(orders['day_part'], orders['drink'], normalize='index')",
        "drink      Latte     Mocha       Tea\nday_part\nAfternoon  0.166667  0.333333  0.500000\nMorning    0.666667  0.166667  0.166667"
      ));

      /* Cheat-sheet tabs */
      root.appendChild(el("h2", { text: "Pandas Cheat Sheet" }));
      root.appendChild(DS.tabs([
        { label: "Peek", content: function () { return DS.codeBlock("df.head()        # first 5 rows\ndf.tail(3)       # last 3 rows\ndf.shape         # (rows, cols)\ndf.dtypes        # column types\ndf.describe()    # summary stats"); } },
        { label: "Select", content: function () { return DS.codeBlock("df['col']           # single column (Series)\ndf[['a','b']]       # multiple columns\ndf.loc[0:2, 'col']  # by label\ndf.iloc[0:2, 0:3]   # by position"); } },
        { label: "Clean", content: function () { return DS.codeBlock("df.dropna()         # remove missing\ndf.fillna(0)        # fill missing\ndf.drop_duplicates()\ndf.rename(columns={'old':'new'})"); } },
        { label: "New columns", content: function () { return DS.codeBlock("df['revenue'] = df['units'] * df['price']\ndf['upper'] = df['name'].str.upper()\ndf['log_rev'] = np.log(df['revenue'])"); } },
        { label: "Aggregate", content: function () { return DS.codeBlock("df.groupby('col').sum()\ndf.groupby('col').agg(['mean','std'])\ndf.groupby('col').agg(total=('val','sum'))\npd.crosstab(df['a'], df['b'])"); } }
      ]));

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Pandas Quiz",
        questions: [
          {
            q: "What is the difference between a Series and a DataFrame?",
            options: ["Series is 2D, DataFrame is 1D", "Series is 1D (one column), DataFrame is 2D (table)", "They are the same", "Series can only hold numbers"],
            answer: 1,
            explain: "A Series is a single column of data. A DataFrame is a table made of multiple Series."
          },
          {
            q: "How do you filter rows where units > 30?",
            options: ["df.filter(units > 30)", "df[df['units'] > 30]", "df.where('units', '>', 30)", "df.query(units > 30)"],
            answer: 1,
            explain: "Boolean masking: df[df['units'] > 30] creates a True/False mask and keeps only True rows."
          },
          {
            q: "What does df.groupby('region')['revenue'].sum() return?",
            options: ["A DataFrame with all columns", "A single number", "A Series with one sum per region", "An error"],
            answer: 2,
            explain: "Grouping by region and summing revenue produces one sum per unique region — returned as a Series."
          },
          {
            q: "What is the default index of a new DataFrame?",
            options: ["Column names", "0, 1, 2, ...", "Random IDs", "No index"],
            answer: 1,
            explain: "By default, Pandas assigns a RangeIndex: 0, 1, 2, ..."
          },
          {
            q: "What does .agg(['sum', 'mean']) do?",
            options: ["Returns sum and mean as two columns", "Returns sum and mean as two rows", "Applies both functions and returns results for each", "Errors because you can only pass one function"],
            answer: 2,
            explain: ".agg() with a list applies each function and returns results in a table with one column per function."
          },
          {
            q: "What does pd.crosstab() count by default?",
            options: ["Sum of values", "Mean of values", "Frequency (counts)", "Unique values"],
            answer: 2,
            explain: "By default, crosstab counts how many times each combination appears (frequency table)."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("pandas"));
      root.appendChild(DS.pageNav("pandas"));
    }
  });
})();
