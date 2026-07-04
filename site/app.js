(function () {
  "use strict";

  var STORAGE_KEY = "todoTasks";

  var taskForm = document.getElementById("task-form");
  var taskInput = document.getElementById("task-input");
  var taskList = document.getElementById("task-list");
  var emptyState = document.getElementById("empty-state");
  var clockEl = document.getElementById("clock");

  /** @type {Array<{id:string, text:string, done:boolean, createdAt:string}>} */
  var tasks = [];

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(tasks)) {
        tasks = [];
      }
    } catch (e) {
      tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // storage unavailable - fail silently, app still works in-memory
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatTimestamp(isoString) {
    var d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return "";
    }
    return d.toLocaleString();
  }

  function updateClock() {
    clockEl.textContent = new Date().toLocaleString();
  }

  function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
    }

    tasks.forEach(function (task) {
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
      metaEl.textContent = "Created: " + formatTimestamp(task.createdAt);

      body.appendChild(textEl);
      body.appendChild(metaEl);

      var actions = document.createElement("div");
      actions.className = "task-actions";

      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn edit";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function () {
        enterEditMode(li, task);
      });

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-btn delete";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteTask(task.id);
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(checkbox);
      li.appendChild(body);
      li.appendChild(actions);

      taskList.appendChild(li);
    });
  }

  function enterEditMode(li, task) {
    var body = li.querySelector(".task-body");
    body.innerHTML = "";

    var editRow = document.createElement("div");
    editRow.className = "edit-row";

    var input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = task.text;

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "icon-btn";
    saveBtn.textContent = "Save";

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "icon-btn";
    cancelBtn.textContent = "Cancel";

    saveBtn.addEventListener("click", function () {
      commitEdit(task.id, input.value);
    });

    cancelBtn.addEventListener("click", function () {
      renderTasks();
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit(task.id, input.value);
      } else if (e.key === "Escape") {
        renderTasks();
      }
    });

    editRow.appendChild(input);
    editRow.appendChild(saveBtn);
    editRow.appendChild(cancelBtn);

    body.appendChild(editRow);
    input.focus();
    input.select();
  }

  function commitEdit(id, newText) {
    var trimmed = newText.trim();
    if (trimmed === "") {
      renderTasks();
      return;
    }
    var task = tasks.find(function (t) {
      return t.id === id;
    });
    if (task) {
      task.text = trimmed;
      saveTasks();
    }
    renderTasks();
  }

  function addTask(text) {
    var trimmed = text.trim();
    if (trimmed === "") {
      return;
    }
    tasks.push({
      id: generateId(),
      text: trimmed,
      done: false,
      createdAt: new Date().toISOString()
    });
    saveTasks();
    renderTasks();
  }

  function toggleDone(id) {
    var task = tasks.find(function (t) {
      return t.id === id;
    });
    if (task) {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    saveTasks();
    renderTasks();
  }

  taskForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
  });

  loadTasks();
  renderTasks();
  updateClock();
  setInterval(updateClock, 1000);
})();
