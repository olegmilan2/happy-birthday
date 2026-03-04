const form = document.getElementById("birthdayForm");
const nameInput = document.getElementById("nameInput");
const dateInput = document.getElementById("dateInput");
const addBtn = document.getElementById("addBtn");
const statusNode = document.getElementById("status");
const listNode = document.getElementById("birthdayList");
const unknownYearCheckbox = document.getElementById("unknownYear");
const monthDayInput = document.getElementById("monthDayInput");

const API_BASE = (
  window.APP_CONFIG && window.APP_CONFIG.API_BASE
    ? String(window.APP_CONFIG.API_BASE)
    : ""
).replace(/\/+$/, "");

const FIREBASE_DB_URL = (
  window.APP_CONFIG && window.APP_CONFIG.FIREBASE_DB_URL
    ? String(window.APP_CONFIG.FIREBASE_DB_URL)
    : ""
).replace(/\/+$/, "");

const USE_FIREBASE_DIRECT = Boolean(FIREBASE_DB_URL);

function apiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function firebaseBirthdaysUrl(id = "") {
  return id
    ? `${FIREBASE_DB_URL}/birthdays/${encodeURIComponent(id)}.json`
    : `${FIREBASE_DB_URL}/birthdays.json`;
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", isError);
}

function formatDateForUi(value) {
  const parts = String(value || "").split("-");
  if (parts.length === 2) {
    return `${parts[1]}.${parts[0]}`;
  }
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return String(value || "");
}

function renderBirthdays(items) {
  listNode.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "Пока пусто";
    listNode.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} — ${formatDateForUi(item.date)}`;
    listNode.appendChild(li);
  });
}

function renderBirthdayItem(item, append = false) {
  const li = document.createElement("li");
  li.textContent = `${item.name} — ${formatDateForUi(item.date)}`;
  if (append) {
    listNode.appendChild(li);
    return;
  }
  listNode.prepend(li);
}

function parseUnknownYearDate(value) {
  const match = /^(\d{2})\.(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const candidate = new Date(Date.UTC(2000, month - 1, day));
  const valid =
    candidate.getUTCFullYear() === 2000 &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;

  if (!valid) {
    return null;
  }
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function loadBirthdays() {
  if (USE_FIREBASE_DIRECT) {
    const response = await fetch(firebaseBirthdaysUrl());
    if (!response.ok) {
      throw new Error(`Firebase error: ${response.status}`);
    }
    const raw = await response.json();
    const items = raw ? Object.values(raw) : [];
    items.sort((a, b) =>
      String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );
    renderBirthdays(items);
    return;
  }

  const response = await fetch(apiUrl("/api/birthdays"));
  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }
  const items = await response.json();
  renderBirthdays(items);
}

unknownYearCheckbox.addEventListener("change", () => {
  const unknownYear = unknownYearCheckbox.checked;
  dateInput.style.display = unknownYear ? "none" : "block";
  monthDayInput.style.display = unknownYear ? "block" : "none";
});

monthDayInput.addEventListener("input", () => {
  const digits = monthDayInput.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    monthDayInput.value = digits;
    return;
  }
  monthDayInput.value = `${digits.slice(0, 2)}.${digits.slice(2)}`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const name = nameInput.value.trim();
  const unknownYear = unknownYearCheckbox.checked;
  const unknownYearDate = unknownYear
    ? parseUnknownYearDate(monthDayInput.value)
    : null;
  const date = unknownYear ? unknownYearDate : dateInput.value;
  if (!name || !date) {
    setStatus("Заполните имя и дату.", true);
    return;
  }
  if (unknownYear && !unknownYearDate) {
    setStatus("Для даты без года используйте формат ДД.ММ, например 02.04.", true);
    return;
  }

  if (window.location.protocol === "file:") {
    setStatus(
      "Откройте страницу через http(s), а не как file://.",
      true
    );
    return;
  }
  if (!USE_FIREBASE_DIRECT && window.location.hostname.endsWith("github.io") && !API_BASE) {
    setStatus(
      "Укажите APP_CONFIG.FIREBASE_DB_URL или APP_CONFIG.API_BASE в config.js.",
      true
    );
    return;
  }

  addBtn.disabled = true;
  const originalText = addBtn.textContent;
  addBtn.textContent = "Сохраняю...";

  try {
    let payload;

    if (USE_FIREBASE_DIRECT) {
      const entry = {
        id: Date.now().toString(),
        name,
        date,
        createdAt: new Date().toISOString(),
      };

      const writeResponse = await fetch(firebaseBirthdaysUrl(entry.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!writeResponse.ok) {
        throw new Error(`Firebase write error: ${writeResponse.status}`);
      }
      payload = entry;
    } else {
      const response = await fetch(apiUrl("/api/birthdays"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          date,
        }),
      });

      payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Ошибка при добавлении");
      }
    }

    setStatus(payload.message || `Добавлено: ${payload.name} (${payload.date})`);
    form.reset();
    dateInput.style.display = "block";
    monthDayInput.style.display = "none";
    renderBirthdayItem(payload, true);
  } catch (error) {
    setStatus(`Ошибка сети: ${error.message}`, true);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = originalText;
  }
});

loadBirthdays().catch(() => {
  if (USE_FIREBASE_DIRECT) {
    setStatus(
      "Firebase недоступен. Проверь FIREBASE_DB_URL и правила доступа в RTDB.",
      true
    );
    return;
  }
  if (window.location.hostname.endsWith("github.io") && !API_BASE) {
    setStatus("Backend не настроен. Укажите APP_CONFIG.API_BASE в config.js.", true);
    return;
  }
  if (window.location.hostname.endsWith("github.io")) {
    setStatus(
      "Backend недоступен по APP_CONFIG.API_BASE. Проверь, что сервер запущен и URL отвечает на /api/birthdays.",
      true
    );
    return;
  }
  setStatus("Сервер недоступен. Запустите `npm start`.", true);
});

setInterval(() => {
  loadBirthdays().catch(() => {});
}, 5000);
