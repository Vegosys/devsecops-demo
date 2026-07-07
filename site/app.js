(function () {
  "use strict";

  var TASKS_KEY = "todo.tasks";
  var THEME_KEY = "todo.theme";
  var SELECTED_DATE_KEY = "todo.selectedDate";
  var WATER_KEY = "todo.waterReminder";

  var taskForm = document.getElementById("task-form");
  var taskInput = document.getElementById("task-input");
  var taskList = document.getElementById("task-list");
  var emptyState = document.getElementById("empty-state");
  var clockEl = document.getElementById("clock");
  var themeButtons = document.querySelectorAll(".theme-btn");
  var selectedDateLabelEl = document.getElementById("selected-date-label");
  var jumpTodayBtn = document.getElementById("jump-today-btn");
  var waterToggleBtn = document.getElementById("water-toggle-btn");
  var waterBanner = document.getElementById("water-banner");
  var waterDismissBtn = document.getElementById("water-dismiss-btn");

  // ---------- Date helpers ----------

  function pad2(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function dateToStr(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function todayStr() {
    return dateToStr(new Date());
  }

  // ---------- Storage helpers ----------

  function loadTasks() {
    try {
      var raw = localStorage.getItem(TASKS_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      // Backfill date field for any legacy tasks without one.
      return parsed.map(function (t) {
        if (!t.date) {
          return Object.assign({}, t, { date: todayStr(), editedAt: t.editedAt || null });
        }
        return t;
      });
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      /* storage unavailable, fail silently */
    }
  }

  function loadSelectedDate() {
    try {
      return localStorage.getItem(SELECTED_DATE_KEY) || todayStr();
    } catch (e) {
      return todayStr();
    }
  }

  function saveSelectedDate(dateStr) {
    try {
      localStorage.setItem(SELECTED_DATE_KEY, dateStr);
    } catch (e) {
      /* ignore */
    }
  }

  var tasks = loadTasks();
  var selectedDate = loadSelectedDate();

  function makeId() {
    return "t-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
  }

  function formatTimestamp(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var datePart = d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    var timePart = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return datePart + ", " + timePart;
  }

  function formatSelectedDateLabel(dateStr) {
    var parts = dateStr.split("-").map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    var label = d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    var suffix = dateStr === todayStr() ? " (Today)" : "";
    return "Tasks for " + label + suffix;
  }

  // ---------- Rendering ----------

  function render() {
    taskList.innerHTML = "";
    selectedDateLabelEl.textContent = formatSelectedDateLabel(selectedDate);

    var visibleTasks = tasks.filter(function (t) {
      return t.date === selectedDate;
    });

    if (visibleTasks.length === 0) {
      emptyState.classList.add("visible");
    } else {
      emptyState.classList.remove("visible");
    }

    visibleTasks.forEach(function (task) {
      taskList.appendChild(buildTaskItem(task));
    });
  }

  function buildTaskItem(task) {
    var li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = !!task.done;
    checkbox.setAttribute("aria-label", "Mark task complete");
    checkbox.addEventListener("change", function () {
      toggleDone(task.id);
    });

    var body = document.createElement("div");
    body.className = "task-body";

    var textEl = document.createElement("div");
    textEl.className = "task-text";
    textEl.textContent = task.text;

    var metaEl = document.createElement("div");
    metaEl.className = "task-meta";
    var metaText = "Created " + formatTimestamp(task.createdAt);
    if (task.editedAt) {
      metaText += " • edited " + formatTimestamp(task.editedAt);
    }
    metaEl.textContent = metaText;

    body.appendChild(textEl);
    body.appendChild(metaEl);

    var actions = document.createElement("div");
    actions.className = "task-actions";

    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn edit";
    editBtn.title = "Edit task";
    editBtn.textContent = "✏️";
    editBtn.addEventListener("click", function () {
      startEdit(li, task, body);
    });

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn delete";
    deleteBtn.title = "Delete task";
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener("click", function () {
      deleteTask(task.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  function startEdit(li, task, body) {
    body.innerHTML = "";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "task-edit-input";
    input.value = task.text;
    input.maxLength = 200;

    body.appendChild(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    var finished = false;

    function commit() {
      if (finished) return;
      finished = true;
      var newText = input.value.trim();
      if (newText && newText !== task.text) {
        updateTaskText(task.id, newText);
      } else {
        render();
      }
    }

    function cancel() {
      if (finished) return;
      finished = true;
      render();
    }

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    });
  }

  // ---------- Task operations ----------

  function addTask(text) {
    var task = {
      id: makeId(),
      text: text,
      done: false,
      date: selectedDate,
      createdAt: new Date().toISOString(),
      editedAt: null,
    };
    tasks.unshift(task);
    saveTasks(tasks);
    render();
    renderCalendar();
  }

  function toggleDone(id) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { done: !t.done });
      }
      return t;
    });
    saveTasks(tasks);
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    saveTasks(tasks);
    render();
    renderCalendar();
  }

  function updateTaskText(id, newText) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { text: newText, editedAt: new Date().toISOString() });
      }
      return t;
    });
    saveTasks(tasks);
    render();
  }

  // ---------- Selected date handling ----------

  function setSelectedDate(dateStr) {
    selectedDate = dateStr;
    saveSelectedDate(selectedDate);
    render();
    renderCalendar();
  }

  jumpTodayBtn.addEventListener("click", function () {
    var t = new Date();
    calViewYear = t.getFullYear();
    calViewMonth = t.getMonth();
    setSelectedDate(todayStr());
  });

  // ---------- Form handling ----------

  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = taskInput.value.trim();
    if (!value) return;
    addTask(value);
    taskInput.value = "";
    taskInput.focus();
  });

  // ---------- Clock ----------

  function updateClock() {
    var now = new Date();
    var datePart = now.toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    var timePart = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    clockEl.textContent = datePart + " • " + timePart;
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ---------- Theme ----------

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeButtons.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.themeChoice === theme);
    });
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "system";
    } catch (e) {
      return "system";
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore */
    }
  }

  themeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var choice = btn.dataset.themeChoice;
      setStoredTheme(choice);
      applyTheme(choice);
    });
  });

  applyTheme(getStoredTheme());

  if (window.matchMedia) {
    var systemMedia = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function () {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    };
    if (systemMedia.addEventListener) {
      systemMedia.addEventListener("change", onSystemChange);
    } else if (systemMedia.addListener) {
      systemMedia.addListener(onSystemChange);
    }
  }

  // ---------- Water break reminder ----------

  var waterTimer = null;

  function loadWaterSettings() {
    try {
      var raw = localStorage.getItem(WATER_KEY);
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed.enabled === "boolean") {
        return {
          enabled: parsed.enabled,
          intervalMinutes: parsed.intervalMinutes || 30,
        };
      }
    } catch (e) {
      /* ignore */
    }
    return { enabled: false, intervalMinutes: 30 };
  }

  function saveWaterSettings(settings) {
    try {
      localStorage.setItem(WATER_KEY, JSON.stringify(settings));
    } catch (e) {
      /* ignore */
    }
  }

  var waterSettings = loadWaterSettings();

  function updateWaterButton() {
    if (waterSettings.enabled) {
      waterToggleBtn.textContent = "💧 Water: On";
      waterToggleBtn.classList.add("on");
    } else {
      waterToggleBtn.textContent = "💧 Water: Off";
      waterToggleBtn.classList.remove("on");
    }
  }

  function showWaterBanner() {
    waterBanner.classList.remove("hidden");
  }

  function hideWaterBanner() {
    waterBanner.classList.add("hidden");
  }

  function startWaterTimer() {
    if (waterTimer) {
      clearInterval(waterTimer);
      waterTimer = null;
    }
    if (waterSettings.enabled) {
      var ms = Math.max(1, waterSettings.intervalMinutes) * 60 * 1000;
      waterTimer = setInterval(showWaterBanner, ms);
    } else {
      hideWaterBanner();
    }
  }

  waterToggleBtn.addEventListener("click", function () {
    waterSettings.enabled = !waterSettings.enabled;
    saveWaterSettings(waterSettings);
    updateWaterButton();
    startWaterTimer();
  });

  waterDismissBtn.addEventListener("click", function () {
    hideWaterBanner();
  });

  updateWaterButton();
  startWaterTimer();

  // ---------- Calendar ----------

  var calPrevBtn = document.getElementById("cal-prev");
  var calNextBtn = document.getElementById("cal-next");
  var calMonthLabel = document.getElementById("cal-month-label");
  var calWeekdaysEl = document.getElementById("calendar-weekdays");
  var calGridEl = document.getElementById("calendar-grid");

  var today = new Date();
  var initialSelected = selectedDate.split("-").map(Number);
  var calViewYear = initialSelected[0];
  var calViewMonth = initialSelected[1] - 1;

  var WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  var MONTH_LABELS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function renderWeekdayHeader() {
    calWeekdaysEl.innerHTML = "";
    WEEKDAY_LABELS.forEach(function (label) {
      var el = document.createElement("div");
      el.textContent = label;
      calWeekdaysEl.appendChild(el);
    });
  }

  function renderCalendar() {
    calMonthLabel.textContent = MONTH_LABELS[calViewMonth] + " " + calViewYear;
    calGridEl.innerHTML = "";

    var firstOfMonth = new Date(calViewYear, calViewMonth, 1);
    var startWeekday = firstOfMonth.getDay();

    var totalCells = 42; // 6 weeks
    var cellDate = new Date(calViewYear, calViewMonth, 1 - startWeekday);

    for (var i = 0; i < totalCells; i++) {
      var thisCellDate = cellDate;
      var ds = dateToStr(thisCellDate);
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal-day";

      var isCurrentMonth = thisCellDate.getMonth() === calViewMonth && thisCellDate.getFullYear() === calViewYear;
      if (!isCurrentMonth) {
        cell.classList.add("other-month");
      }
      if (ds === todayStr()) {
        cell.classList.add("today");
      }
      if (ds === selectedDate) {
        cell.classList.add("selected");
      }
      if (tasks.some(function (t) { return t.date === ds; })) {
        cell.classList.add("has-tasks");
      }
      cell.textContent = String(thisCellDate.getDate());
      cell.setAttribute("aria-label", ds);

      (function (dateForClick, cellMonth, cellYear) {
        cell.addEventListener("click", function () {
          if (cellMonth !== calViewMonth || cellYear !== calViewYear) {
            calViewMonth = cellMonth;
            calViewYear = cellYear;
          }
          setSelectedDate(dateForClick);
        });
      })(ds, thisCellDate.getMonth(), thisCellDate.getFullYear());

      calGridEl.appendChild(cell);

      cellDate = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate() + 1);
    }
  }

  calPrevBtn.addEventListener("click", function () {
    calViewMonth -= 1;
    if (calViewMonth < 0) {
      calViewMonth = 11;
      calViewYear -= 1;
    }
    renderCalendar();
  });

  calNextBtn.addEventListener("click", function () {
    calViewMonth += 1;
    if (calViewMonth > 11) {
      calViewMonth = 0;
      calViewYear += 1;
    }
    renderCalendar();
  });

  renderWeekdayHeader();
  renderCalendar();

  // ---------- Initial render ----------

  render();
})();
