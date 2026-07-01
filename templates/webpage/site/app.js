const STORAGE_KEY = "todo-list-tasks";

const form = document.getElementById("add-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function render(tasks) {
  list.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No tasks yet — add one above.";
    list.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const item = document.createElement("li");
    item.className = "task" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const text = document.createElement("span");
    text.textContent = task.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, text, deleteBtn);
    list.appendChild(item);
  }
}

function addTask(text) {
  const tasks = loadTasks();
  tasks.push({ id: crypto.randomUUID(), text, done: false });
  saveTasks(tasks);
  render(tasks);
}

function toggleTask(id) {
  const tasks = loadTasks();
  const task = tasks.find((t) => t.id === id);
  if (task) task.done = !task.done;
  saveTasks(tasks);
  render(tasks);
}

function deleteTask(id) {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  render(tasks);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = "";
  input.focus();
});

render(loadTasks());
