const state = {
  tasks: []
};

const apiBaseUrl = window.__APP_CONFIG__?.apiBaseUrl || '/api';
const taskList = document.getElementById('task-list');
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const status = document.getElementById('status');

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Request failed');
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

function renderTasks() {
  if (state.tasks.length === 0) {
    taskList.innerHTML = '<li>No tasks yet.</li>';
    return;
  }

  taskList.innerHTML = state.tasks.map((task) => `
    <li>
      <div class="task-main">
        <input type="checkbox" ${task.done ? 'checked' : ''} data-action="toggle" data-id="${task.id}" />
        <span class="${task.done ? 'done' : ''}">${task.title}</span>
      </div>
      <div>
        <button class="secondary" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </li>
  `).join('');
}

async function loadTasks() {
  status.textContent = 'Loading tasks...';
  try {
    const tasks = await fetchJson(`${apiBaseUrl}/tasks`);
    state.tasks = tasks;
    renderTasks();
    status.textContent = 'Tasks loaded';
  } catch (error) {
    status.textContent = error.message;
  }
}

async function createTask(title) {
  try {
    const task = await fetchJson(`${apiBaseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    state.tasks = [...state.tasks, task];
    renderTasks();
    status.textContent = 'Task added';
  } catch (error) {
    status.textContent = error.message;
  }
}

async function toggleTask(id, done) {
  try {
    const task = await fetchJson(`${apiBaseUrl}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done })
    });
    state.tasks = state.tasks.map((item) => (item.id === task.id ? task : item));
    renderTasks();
    status.textContent = 'Task updated';
  } catch (error) {
    status.textContent = error.message;
  }
}

async function deleteTask(id) {
  try {
    await fetchJson(`${apiBaseUrl}/tasks/${id}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter((item) => item.id !== id);
    renderTasks();
    status.textContent = 'Task deleted';
  } catch (error) {
    status.textContent = error.message;
  }
}

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) {
    return;
  }
  taskTitleInput.value = '';
  await createTask(title);
});

taskList.addEventListener('click', async (event) => {
  const target = event.target;
  if (target.matches('[data-action="delete"]')) {
    await deleteTask(Number(target.dataset.id));
  }
});

taskList.addEventListener('change', async (event) => {
  const target = event.target;
  if (target.matches('input[type="checkbox"]')) {
    await toggleTask(Number(target.dataset.id), target.checked);
  }
});

window.addEventListener('DOMContentLoaded', loadTasks);
