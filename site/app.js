(function () {
  "use strict";

  var TASKS_KEY = "todo.tasks";
  var THEME_KEY = "todo.theme";

  var taskForm = document.getElementById("task-form");
  var taskInput = document.getElementById("task-input");
  var taskList = document.getElementById("task-list");
  var emptyState = document.getElementById("empty-state");
  var clockEl = document.getElementById("clock");
  var themeButtons = document.querySelectorAll(".theme-btn");

  // ---------- Storage helpers ----------

  function loadTasks() {
    try {
      var raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
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

  var tasks = loadTasks();

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

  // ---------- Rendering ----------

  function render() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.classList.add("visible");
    } else {
      emptyState.classList.remove("visible");
    }

    tasks.forEach(function (task) {
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
    metaEl.textContent = "Created " + formatTimestamp(task.createdAt);

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
      if (newText) {
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
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    saveTasks(tasks);
    render();
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
  }

  function updateTaskText(id, newText) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { text: newText });
      }
      return t;
    });
    saveTasks(tasks);
    render();
  }

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

  // ---------- Initial render ----------

  render();
})();
