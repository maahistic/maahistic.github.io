(function () {
  "use strict";
  var el = DS.el;

  DS.registerTopic({
    id: "home",
    title: "Home",
    icon: "🏠",
    subtitle: "",
    order: 0,
    countable: false,
    render: function (root) {
      /* Hero */
      var hero = el("div", { class: "hero" },
        el("span", { class: "eyebrow", text: "Interactive · Pure HTML/CSS/JS · No install" }),
        el("div", { class: "grad-text", text: "Learn Data Science by playing with it" }),
        el("p", { class: "lead", text: "An interactive, self-paced course covering Python, NumPy, Pandas, Matplotlib, Statistics, and Seaborn — with hands-on widgets, live charts, and quizzes in every section." }),
        el("div", { class: "hero-btns" },
          el("a", { href: "#/intro", class: "btn" }, "🚀 Start with Intro"),
          el("a", { href: "#/numpy", class: "btn secondary" }, "🔢 Jump to NumPy")
        )
      );
      root.appendChild(hero);

      /* What you'll explore */
      root.appendChild(el("h2", { text: "What you'll explore" }));
      var grid = el("div", { class: "card-grid" });
      DS.topics.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (t) {
        if (t.order < 1) return;
        grid.appendChild(
          el("a", { href: "#/" + t.id, class: "topic-card" },
            el("div", { class: "tc-icon", text: t.icon }),
            el("div", { class: "tc-title", text: t.title }),
            el("div", { class: "tc-sub", text: t.subtitle }),
            el("div", { class: "tc-order", text: "Module " + t.order })
          )
        );
      });
      root.appendChild(grid);

      /* How pieces fit */
      root.appendChild(el("h2", { text: "How the pieces fit together" }));
      root.appendChild(DS.callout("info",
        "<strong>NumPy</strong> gives you fast arrays → <strong>Pandas</strong> builds tables on them → " +
        "<strong>Matplotlib</strong> draws charts from those tables → <strong>Seaborn</strong> makes the charts beautiful with one line → " +
        "<strong>Statistics</strong> tells you what the numbers actually mean. Each layer builds on the last."
      ));

      /* Features grid */
      root.appendChild(el("h2", { text: "Features" }));
      var feats = [
        { icon: "🎮", title: "Interactive Widgets", desc: "Sliders, builders, and explorers in every section" },
        { icon: "📊", title: "Live Canvas Charts", desc: "All charts drawn with the HTML5 Canvas API" },
        { icon: "🧠", title: "Quizzes", desc: "Test your understanding at the end of each topic" },
        { icon: "🌙", title: "Dark Mode", desc: "Toggle theme any time — your preference is saved" }
      ];
      var fGrid = el("div", { class: "p-grid" });
      feats.forEach(function (f) {
        fGrid.appendChild(el("div", { class: "feat" },
          el("div", { class: "f-icon", text: f.icon }),
          el("div", { class: "f-title", text: f.title }),
          el("div", { class: "f-desc", text: f.desc })
        ));
      });
      root.appendChild(fGrid);

      /* Suggested path */
      root.appendChild(el("h2", { text: "Suggested path" }));
      var ol = el("ol", { class: "suggested-path" });
      DS.topics.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (t) {
        if (t.order < 1) return;
        ol.appendChild(el("li", null,
          el("strong", { text: t.icon + " " + t.title }),
          " — " + t.subtitle
        ));
      });
      root.appendChild(ol);

      /* Tip */
      root.appendChild(DS.callout("tip",
        "💡 Your progress and dark-mode preference are <strong>saved automatically</strong> in your browser. " +
        "Pick up right where you left off!"
      ));
    }
  });
})();
