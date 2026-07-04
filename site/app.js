(function () {
  'use strict';

  const STORAGE_KEY = 'todoListTasks';

  const form = document.getElementById('todo-form');
  const input = document.getElementById('task-input');
  const list = document.getElementById('todo-list');

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

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
  }

  let tasks = loadTasks();

  function render() {
    list.innerHTML = '';
    tasks.forEach(function (task) {
      const li = document.createElement('li');
      li.className = 'todo-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.done;
      checkbox.addEventListener('change', function () {
        toggleDone(task.id);
      });

      const span = document.createElement('span');
      span.className = 'task-text';
      span.textContent = task.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', function () {
        deleteTask(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    tasks.push({ id: generateId(), text: trimmed, done: false });
    saveTasks(tasks);
    render();
  }

  function toggleDone(id) {
    tasks = tasks.map(function (task) {
      if (task.id === id) {
        return Object.assign({}, task, { done: !task.done });
      }
      return task;
    });
    saveTasks(tasks);
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (task) {
      return task.id !== id;
    });
    saveTasks(tasks);
    render();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  render();
})();
