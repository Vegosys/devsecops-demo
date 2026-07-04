(function () {
  "use strict";

  const STORAGE_KEY = "todoAppTasks";

  const taskInput = document.getElementById("taskInput");
  const addBtn = document.getElementById("addBtn");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const clockEl = document.getElementById("clock");

  let tasks = loadTasks();

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function formatTimestamp(isoString) {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      emptyState.style.display = "block";
      return;
    }
    emptyState.style.display = "none";

    tasks.forEach(function (task) {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");
      li.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = !!task.done;
      checkbox.addEventListener("change", function () {
        toggleTask(task.id);
      });

      const content = document.createElement("div");
      content.className = "task-content";

      const textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = task.text;

      const timeSpan = document.createElement("span");
      timeSpan.className = "task-timestamp";
      timeSpan.textContent = "Added: " + formatTimestamp(task.createdAt);

      content.appendChild(textSpan);
      content.appendChild(timeSpan);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteTask(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(deleteBtn);

      taskList.appendChild(li);
    });
  }

  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
      id: generateId(),
      text: text,
      done: false,
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskInput.focus();
  }

  function toggleTask(id) {
    const task = tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.done = !task.done;
      saveTasks();
      renderTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveTasks();
    renderTasks();
  }

  function updateClock() {
    const now = new Date();
    clockEl.textContent = now.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  addBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addTask();
    }
  });

  updateClock();
  setInterval(updateClock, 60000);

  renderTasks();
})();
