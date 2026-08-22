(function () {
  "use strict";
  var el = DS.el;

  DS.registerTopic({
    id: "intro",
    title: "What is Data Science?",
    icon: "👋",
    subtitle: "The big picture — ask, collect, clean, explore, model, communicate",
    order: 1,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "👋 What is Data Science?" }));
      root.appendChild(el("p", { class: "section-intro", text: "Data science is the art of turning raw data into useful insights. It combines statistics, programming, and domain knowledge to answer questions and solve problems." }));

      /* Coffee shop example */
      root.appendChild(el("h2", { text: "A coffee-shop example" }));
      root.appendChild(el("p", null,
        "Imagine you manage a coffee shop. Every day you collect data: what drinks people order, " +
        "what time they visit, how much they spend. Data science helps you answer questions like ",
        el("em", { text: "\"Should we stock more oat milk on Mondays?\"" }),
        " or ",
        el("em", { text: "\"Which pastry pairs best with a latte?\"" })
      ));

      /* Lifecycle stepper */
      var stages = [
        { icon: "❓", name: "Ask", desc: "Start with a clear question. \"Why did latte sales drop in July?\"", tools: "Business knowledge, curiosity" },
        { icon: "🗂", name: "Collect", desc: "Gather relevant data — POS logs, weather data, customer surveys.", tools: "SQL, APIs, web scraping, surveys" },
        { icon: "🧹", name: "Clean", desc: "Fix missing values, remove duplicates, standardize formats. This step is ~80% of the work!", tools: "Pandas, OpenRefine, regular expressions" },
        { icon: "🔭", name: "Explore", desc: "Visualize distributions and relationships. Spot patterns and outliers before building models.", tools: "Matplotlib, Seaborn, Pandas .describe()" },
        { icon: "🤖", name: "Model", desc: "Apply statistics or machine learning to quantify patterns and make predictions.", tools: "scikit-learn, statsmodels, XGBoost" },
        { icon: "📊", name: "Communicate", desc: "Present findings with clear charts and plain-language summaries so stakeholders can act on them.", tools: "Jupyter Notebooks, dashboards, presentations" }
      ];
      var activeIdx = 0;
      var detailBox = el("div", { class: "step-detail" });

      function renderDetail(i) {
        detailBox.innerHTML = "";
        detailBox.appendChild(el("p", null, el("strong", { text: stages[i].name + ": " }), stages[i].desc));
        detailBox.appendChild(el("div", { class: "tools", text: "Typical tools: " + stages[i].tools }));
      }

      var stepper = el("div", { class: "stepper" });
      var stepEls = [];
      stages.forEach(function (s, i) {
        var stepEl = el("div", { class: "step" + (i === 0 ? " active" : "") },
          el("span", { class: "step-icon", text: s.icon }),
          el("span", { class: "step-title", text: s.name }),
          el("span", { class: "step-num", text: "Step " + (i + 1) })
        );
        stepEl.addEventListener("click", function () {
          stepEls.forEach(function (se) { se.classList.remove("active"); });
          stepEl.classList.add("active");
          activeIdx = i;
          renderDetail(i);
        });
        stepEls.push(stepEl);
        stepper.appendChild(stepEl);
      });

      renderDetail(0);
      var w = DS.widget("Interactive Lifecycle Stepper", "🔄", "Interactive", stepper, detailBox);
      root.appendChild(w);

      /* Why Python */
      root.appendChild(el("h2", { text: "Why Python?" }));
      root.appendChild(el("p", { text: "Python has become the lingua franca of data science because of three key libraries:" }));
      var pills = el("div", { class: "chips" },
        el("span", { class: "chip active", text: "🔢 NumPy — fast arrays" }),
        el("span", { class: "chip active", text: "🐼 Pandas — tabular data" }),
        el("span", { class: "chip active", text: "📈 Matplotlib — visualization" })
      );
      root.appendChild(pills);
      root.appendChild(el("p", { text: "Together, they let you go from raw CSV to polished chart in just a few lines of code. This course teaches each one hands-on." }));

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Intro Quiz",
        questions: [
          {
            q: "What percentage of a data scientist's time is typically spent on data cleaning?",
            options: ["10%", "30%", "80%", "50%"],
            answer: 2,
            explain: "Data cleaning (fixing missing values, removing duplicates, standardizing formats) typically takes up about 80% of a data project's time."
          },
          {
            q: "What is the FIRST step in the data science lifecycle?",
            options: ["Collect data", "Ask a question", "Build a model", "Clean data"],
            answer: 1,
            explain: "Everything starts with a clear question. Without a good question, you don't know what data to collect."
          },
          {
            q: "What does EDA stand for?",
            options: ["Electronic Data Analysis", "Exploratory Data Analysis", "Extended Data Application", "External Data Aggregation"],
            answer: 1,
            explain: "Exploratory Data Analysis (EDA) is the step where you visualize and summarize data to find patterns before formal modeling."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("intro"));
      root.appendChild(DS.pageNav("intro"));
    }
  });
})();
