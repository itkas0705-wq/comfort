// ==========================================
// КОМФОРТ+ — ОСНОВНАЯ ЛОГИКА
// ==========================================

const STORAGE_KEY = "comfortPlusData";

const defaultData = {
  name: "Пользователь",
  theme: "light",
  largeText: false,
  tasks: [
    {
      id: 1,
      title: "Посмотреть расписание",
      category: "Учёба",
      date: new Date().toISOString().slice(0, 10),
      done: false
    },
    {
      id: 2,
      title: "Подготовить необходимые материалы",
      category: "Учёба",
      date: new Date().toISOString().slice(0, 10),
      done: false
    },
    {
      id: 3,
      title: "Разобрать список дел",
      category: "Личное",
      date: new Date().toISOString().slice(0, 10),
      done: true
    }
  ]
};

let data;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  data = saved ? { ...defaultData, ...saved } : structuredClone(defaultData);

  if (!Array.isArray(data.tasks)) {
    data.tasks = [];
  }
} catch {
  data = structuredClone(defaultData);
}

let currentFilter = "all";
let activeScenario = null;

// ==========================================
// СОХРАНЕНИЕ
// ==========================================

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ==========================================
// НАВИГАЦИЯ
// ==========================================

function openPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const target = document.getElementById(`page-${pageName}`);

  if (target) {
    target.classList.add("active");
  }

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageName
    );
  });

  if (pageName === "tasks") {
    renderAllTasks();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});

document.getElementById("quickSettings").addEventListener("click", () => {
  openPage("settings");
});

// ==========================================
// ДАТА И ПРИВЕТСТВИЕ
// ==========================================

function renderDate() {
  const now = new Date();

  const formatted = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  document.getElementById("todayDate").textContent =
    formatted.toUpperCase();
}

function renderUser() {
  const name = data.name || "Пользователь";

  document.getElementById("welcomeName").textContent = name;
  document.getElementById("sidebarName").textContent = name;
  document.getElementById("avatarLetter").textContent =
    name.charAt(0).toUpperCase();

  document.getElementById("nameInput").value = name;
}

// ==========================================
// ЗАДАЧИ
// ==========================================

function createTask(title, category, date) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    category,
    date,
    done: false
  };
}

function renderStats() {
  const total = data.tasks.length;
  const done = data.tasks.filter(task => task.done).length;
  const left = total - done;

  const percent = total === 0
    ? 0
    : Math.round((done / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("doneTasks").textContent = done;
  document.getElementById("leftTasks").textContent = left;
  document.getElementById("taskCount").textContent = left;

  document.getElementById("progressPercent").textContent =
    percent + "%";

  document.getElementById("progressBar").style.width =
    percent + "%";
}

function categoryLabel(category) {
  const labels = {
    "Личное": "Личное",
    "Учёба": "Учёба",
    "Дом": "Дом",
    "Работа": "Работа",
    "Другое": "Другое"
  };

  return labels[category] || category;
}

function createTaskElement(task) {
  const item = document.createElement("div");
  item.className = "task-item";

  if (task.done) {
    item.classList.add("completed");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.done;
  checkbox.setAttribute("aria-label", "Отметить выполнение");

  checkbox.addEventListener("change", () => {
    toggleTask(task.id);
  });

  const info = document.createElement("div");
  info.className = "task-info";

  const title = document.createElement("strong");
  title.textContent = task.title;

  const details = document.createElement("small");
  details.textContent =
    `${categoryLabel(task.category)} · ${formatTaskDate(task.date)}`;

  info.append(title, details);

  const remove = document.createElement("button");
  remove.className = "task-delete";
  remove.textContent = "×";
  remove.title = "Удалить задачу";

  remove.addEventListener("click", () => {
    deleteTask(task.id);
  });

  item.append(checkbox, info, remove);

  return item;
}

function formatTaskDate(date) {
  if (!date) return "Без даты";

  const today = new Date().toISOString().slice(0, 10);

  if (date === today) return "Сегодня";

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date === tomorrow.toISOString().slice(0, 10)) {
    return "Завтра";
  }

  const parts = date.split("-");

  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  return date;
}

function renderTodayTasks() {
  const container = document.getElementById("todayTaskList");
  container.innerHTML = "";

  const today = new Date().toISOString().slice(0, 10);

  const tasks = data.tasks.filter(task =>
    task.date === today || !task.date
  );

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "На сегодня пока нет задач. Можно немного отдохнуть!";
    container.appendChild(empty);
    return;
  }

  tasks.slice(0, 5).forEach(task => {
    container.appendChild(createTaskElement(task));
  });
}

function renderAllTasks() {
  const container = document.getElementById("allTaskList");
  container.innerHTML = "";

  let tasks = [...data.tasks];

  if (currentFilter === "active") {
    tasks = tasks.filter(task => !task.done);
  }

  if (currentFilter === "done") {
    tasks = tasks.filter(task => task.done);
  }

  tasks.sort((a, b) => {
    if (a.done !== b.done) {
      return Number(a.done) - Number(b.done);
    }

    return (a.date || "").localeCompare(b.date || "");
  });

  if (tasks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Здесь пока ничего нет.";
    container.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    container.appendChild(createTaskElement(task));
  });
}

function toggleTask(id) {
  const task = data.tasks.find(item => item.id === id);

  if (!task) return;

  task.done = !task.done;

  saveData();
  refreshInterface();

  showToast(
    task.done
      ? "Задача выполнена!"
      : "Задача возвращена в список."
  );
}

function deleteTask(id) {
  data.tasks = data.tasks.filter(task => task.id !== id);

  saveData();
  refreshInterface();

  showToast("Задача удалена.");
}

// ==========================================
// ДОБАВЛЕНИЕ ЗАДАЧИ
// ==========================================

const taskModal = document.getElementById("taskModal");

function openTaskModal() {
  taskModal.classList.add("open");

  document.getElementById("taskDate").value =
    new Date().toISOString().slice(0, 10);

  setTimeout(() => {
    document.getElementById("taskTitle").focus();
  }, 100);
}

function closeTaskModal() {
  taskModal.classList.remove("open");
  document.getElementById("taskForm").reset();
}

document.getElementById("openTaskModal")
  .addEventListener("click", openTaskModal);

document.getElementById("openTaskModal2")
  .addEventListener("click", openTaskModal);

document.getElementById("closeModal")
  .addEventListener("click", closeTaskModal);

taskModal.addEventListener("click", event => {
  if (event.target === taskModal) {
    closeTaskModal();
  }
});

document.getElementById("taskForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("taskTitle")
    .value.trim();

  const category = document.getElementById("taskCategory")
    .value;

  const date = document.getElementById("taskDate")
    .value;

  if (!title) {
    showToast("Введите название задачи.");
    return;
  }

  data.tasks.push(createTask(title, category, date));

  saveData();
  refreshInterface();
  closeTaskModal();

  showToast("Новая задача добавлена!");
});

// ==========================================
// ФИЛЬТРЫ
// ==========================================

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter-button").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderAllTasks();
  });
});

// ==========================================
// ЖИЗНЕННЫЕ СЦЕНАРИИ
// ==========================================

const scenarios = {
  "Утро": [
    "Проверить расписание",
    "Посмотреть список задач",
    "Подготовить необходимые вещи"
  ],

  "Учебный день": [
    "Проверить расписание занятий",
    "Посмотреть домашние задания",
    "Подготовить учебные материалы",
    "Проверить важные сроки"
  ],

  "Домой": [
    "Проверить список покупок",
    "Посмотреть домашние задачи",
    "Запланировать время на отдых"
  ],

  "Выходной": [
    "Выбрать занятие для отдыха",
    "Запланировать прогулку",
    "Оставить время без дел"
  ]
};

function openScenario(name) {
  const list = scenarios[name];

  if (!list) return;

  activeScenario = name;

  document.getElementById("scenarioTitle").textContent = name;

  const container = document.getElementById("scenarioChecklist");
  container.innerHTML = "";

  list.forEach((item, index) => {
    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.index = index;

    const text = document.createElement("span");
    text.textContent = item;

    label.append(checkbox, text);
    container.appendChild(label);
  });

  document.getElementById("scenarioModal")
    .classList.add("open");
}

document.querySelectorAll("[data-scenario]").forEach(button => {
  button.addEventListener("click", () => {
    openScenario(button.dataset.scenario);
  });
});

document.getElementById("closeScenarioModal")
  .addEventListener("click", () => {
    document.getElementById("scenarioModal")
      .classList.remove("open");
  });

document.getElementById("finishScenario")
  .addEventListener("click", () => {
    const modal = document.getElementById("scenarioModal");

    const checked = modal.querySelectorAll(
      'input[type="checkbox"]:checked'
    ).length;

    const total = modal.querySelectorAll(
      'input[type="checkbox"]'
    ).length;

    modal.classList.remove("open");

    showToast(`Выполнено пунктов: ${checked} из ${total}.`);
  });

// ==========================================
// НАСТРОЙКИ ПОЛЬЗОВАТЕЛЯ
// ==========================================

document.getElementById("nameInput")
  .addEventListener("change", event => {
    const name = event.target.value.trim();

    data.name = name || "Пользователь";

    saveData();
    renderUser();

    showToast("Имя обновлено.");
  });

// ==========================================
// ТЕМА
// ==========================================

function applyTheme() {
  document.body.classList.toggle(
    "dark-theme",
    data.theme === "dark"
  );

  document.querySelectorAll(".theme-choice").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.theme === data.theme
    );
  });
}

document.querySelectorAll(".theme-choice").forEach(button => {
  button.addEventListener("click", () => {
    data.theme = button.dataset.theme;

    saveData();
    applyTheme();

    showToast("Оформление изменено.");
  });
});

// ==========================================
// РАЗМЕР ТЕКСТА
// ==========================================

function applyFontSize() {
  document.body.classList.toggle(
    "large-text",
    data.largeText
  );

  document.getElementById("fontToggle").textContent =
    data.largeText
      ? "Обычный текст"
      : "Увеличить текст";
}

document.getElementById("fontToggle")
  .addEventListener("click", () => {
    data.largeText = !data.largeText;

    saveData();
    applyFontSize();
  });

// ==========================================
// СБРОС ДАННЫХ
// ==========================================

document.getElementById("clearData")
  .addEventListener("click", () => {
    const confirmed = confirm(
      "Удалить все задачи и вернуть настройки по умолчанию?"
    );

    if (!confirmed) return;

    data = structuredClone(defaultData);

    saveData();
    refreshInterface();

    showToast("Данные сброшены.");
  });

// ==========================================
// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
// ==========================================

function refreshInterface() {
  renderUser();
  renderStats();
  renderTodayTasks();
  renderAllTasks();
  applyTheme();
  applyFontSize();
}

// ==========================================
// ЗАПУСК
// ==========================================

renderDate();
refreshInterface();