(function () {
  "use strict";
  var el = DS.el;

  DS.registerTopic({
    id: "python",
    title: "Python Basics",
    icon: "🐍",
    subtitle: "Variables, lists, dicts, loops, functions — the essentials",
    order: 2,
    countable: true,
    render: function (root) {
      root.appendChild(el("h1", { text: "🐍 Python Basics" }));
      root.appendChild(el("p", { class: "section-intro", text: "Before diving into data libraries, you need comfortable shoes. Here are the Python essentials every data scientist uses daily." }));

      /* Variables & types */
      root.appendChild(el("h2", { text: "Variables & types" }));
      root.appendChild(el("p", { text: "Python figures out the type for you — no need to declare int or float." }));
      root.appendChild(DS.runnable(
        'name = "Alice"\nage = 30\nheight = 5.6\nis_student = False\n\nprint(type(name))    # <class \'str\'>\nprint(type(age))     # <class \'int\'>\nprint(type(height))  # <class \'float\'>',
        "<class 'str'>\n<class 'int'>\n<class 'float'>"
      ));

      /* Lists */
      root.appendChild(el("h2", { text: "Lists — indexing & slicing" }));
      root.appendChild(el("p", { text: "Lists are ordered, mutable collections. Indexing starts at 0; negative indices count from the end." }));
      root.appendChild(DS.runnable(
        'fruits = ["apple", "banana", "cherry", "date", "elderberry"]\n\nprint(fruits[0])      # apple\nprint(fruits[-1])     # elderberry\nprint(fruits[1:3])    # [\'banana\', \'cherry\']\nprint(fruits[:2])     # [\'apple\', \'banana\']\nprint(len(fruits))    # 5',
        "apple\nelderberry\n['banana', 'cherry']\n['apple', 'banana']\n5"
      ));

      /* Dicts */
      root.appendChild(el("h2", { text: "Dictionaries" }));
      root.appendChild(el("p", { text: "Key-value pairs — perfect for structured data before you learn Pandas." }));
      root.appendChild(DS.runnable(
        'person = {"name": "Alice", "age": 30, "city": "Pune"}\n\nprint(person["name"])         # Alice\nprint(person.get("email", "N/A"))  # N/A\nperson["email"] = "a@b.com"\nprint(person.keys())          # dict_keys([...])',
        "Alice\nN/A\ndict_keys(['name', 'age', 'city', 'email'])"
      ));

      /* Loops */
      root.appendChild(el("h2", { text: "Loops, enumerate & f-strings" }));
      root.appendChild(DS.runnable(
        'fruits = ["apple", "banana", "cherry"]\n\nfor i, fruit in enumerate(fruits):\n    print(f"{i}: {fruit}")',
        "0: apple\n1: banana\n2: cherry"
      ));

      /* Functions */
      root.appendChild(el("h2", { text: "Functions" }));
      root.appendChild(DS.runnable(
        'def greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Alice"))\nprint(greet("Bob", "Hi"))',
        "Hello, Alice!\nHi, Bob!"
      ));

      /* List Comprehension Builder */
      root.appendChild(el("h2", { text: "Interactive: List Comprehension Builder" }));

      var nSlider, exprSelect, filterSelect, kSlider, kControl;
      var codeOut, resultOut;

      function update() {
        var n = parseInt(nSlider.value, 10);
        var expr = exprSelect.value;
        var filt = filterSelect.value;
        var k = parseInt(kSlider.value, 10);

        kControl.style.display = filt === "gt_k" ? "flex" : "none";

        var exprStr = expr === "x" ? "x" : expr === "x2" ? "x**2" : expr === "x*2" ? "x * 2" : "x * 10";
        var filterStr = "";
        if (filt === "even") filterStr = " if x % 2 == 0";
        else if (filt === "odd") filterStr = " if x % 2 != 0";
        else if (filt === "gt_k") filterStr = " if x > " + k;

        var code = "result = [" + exprStr + " for x in range(" + n + ")" + filterStr + "]";

        // Compute result
        var items = [];
        for (var x = 0; x < n; x++) {
          if (filt === "even" && x % 2 !== 0) continue;
          if (filt === "odd" && x % 2 === 0) continue;
          if (filt === "gt_k" && x <= k) continue;
          var v = expr === "x" ? x : expr === "x2" ? x * x : expr === "x*2" ? x * 2 : x * 10;
          items.push(v);
        }

        codeOut.innerHTML = DS.pyHighlight(code);
        resultOut.textContent = "[" + items.join(", ") + "]";
      }

      nSlider = el("input", { type: "range", min: "3", max: "12", value: "6" });
      var nVal = el("span", { class: "val", text: "6" });
      nSlider.addEventListener("input", function () { nVal.textContent = nSlider.value; update(); });

      exprSelect = el("select", null,
        el("option", { value: "x", text: "x" }),
        el("option", { value: "x2", text: "x ** 2" }),
        el("option", { value: "x*2", text: "x * 2" }),
        el("option", { value: "x*10", text: "x * 10" })
      );
      exprSelect.addEventListener("change", update);

      filterSelect = el("select", null,
        el("option", { value: "none", text: "No filter" }),
        el("option", { value: "even", text: "Even only (x % 2 == 0)" }),
        el("option", { value: "odd", text: "Odd only (x % 2 != 0)" }),
        el("option", { value: "gt_k", text: "x > k" })
      );
      filterSelect.addEventListener("change", update);

      kSlider = el("input", { type: "range", min: "0", max: "11", value: "3" });
      var kVal = el("span", { class: "val", text: "3" });
      kSlider.addEventListener("input", function () { kVal.textContent = kSlider.value; update(); });

      kControl = el("div", { class: "control", style: { display: "none" } },
        el("label", { text: "k" }),
        kSlider, kVal
      );

      var controls = el("div", { class: "controls" },
        el("div", { class: "control" }, el("label", { text: "range(n)" }), nSlider, nVal),
        el("div", { class: "control" }, el("label", { text: "Expression" }), exprSelect),
        el("div", { class: "control" }, el("label", { text: "Filter" }), filterSelect),
        kControl
      );

      codeOut = el("pre", { style: { fontFamily: "var(--font-mono)", fontSize: ".9rem", margin: "12px 0", padding: "12px 16px", background: "var(--code-bg)", color: "var(--code-text)", borderRadius: "var(--radius-sm)", overflowX: "auto" } });
      resultOut = el("div", { class: "output" });

      var w = DS.widget("List Comprehension Builder", "🔧", "Interactive",
        controls, codeOut,
        el("div", null, el("strong", { text: "Result: " })),
        resultOut
      );
      root.appendChild(w);
      update();

      /* Quiz */
      root.appendChild(el("h2", { text: "Check your understanding" }));
      root.appendChild(DS.quiz({
        title: "Python Basics Quiz",
        questions: [
          {
            q: "What does fruits[-1] return if fruits = ['a', 'b', 'c']?",
            options: ["'a'", "'c'", "Error", "None"],
            answer: 1,
            explain: "Negative indices count from the end. -1 is the last element."
          },
          {
            q: "What is the output of [x**2 for x in range(4)]?",
            options: ["[1, 4, 9, 16]", "[0, 1, 4, 9]", "[0, 2, 4, 6]", "[1, 2, 3, 4]"],
            answer: 1,
            explain: "range(4) = [0,1,2,3], squared = [0,1,4,9]."
          },
          {
            q: "What type does {'a': 1} create?",
            options: ["list", "set", "dict", "tuple"],
            answer: 2,
            explain: "Curly braces with key:value pairs create a dictionary (dict)."
          }
        ]
      }));

      root.appendChild(DS.doneToggle("python"));
      root.appendChild(DS.pageNav("python"));
    }
  });
})();
