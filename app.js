const form = document.getElementById("birthdayForm");
const nameInput = document.getElementById("nameInput");
const dateInput = document.getElementById("dateInput");
const addBtn = document.getElementById("addBtn");
const statusNode = document.getElementById("status");
const statusIconNode = document.getElementById("statusIcon");
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
const CACHE_KEY = "hb_birthdays_cache_v1";
const OUTBOX_KEY = "hb_birthdays_outbox_v1";

function apiUrl(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function firebaseBirthdaysUrl(id = "") {
  return id
    ? `${FIREBASE_DB_URL}/birthdays/${encodeURIComponent(id)}.json`
    : `${FIREBASE_DB_URL}/birthdays.json`;
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalCache() {
  return readJsonStorage(CACHE_KEY, []);
}

function setLocalCache(items) {
  writeJsonStorage(CACHE_KEY, items);
}

function upsertLocalCacheItem(item) {
  const list = getLocalCache();
  const index = list.findIndex((entry) => String(entry.id) === String(item.id));
  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.push(item);
  }
  list.sort((a, b) =>
    String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
  );
  setLocalCache(list);
}

function removeLocalCacheItem(id) {
  const next = getLocalCache().filter((item) => String(item.id) !== String(id));
  setLocalCache(next);
}

function getOutbox() {
  return readJsonStorage(OUTBOX_KEY, []);
}

function setOutbox(items) {
  writeJsonStorage(OUTBOX_KEY, items);
}

function pushOutbox(op) {
  const outbox = getOutbox();
  outbox.push(op);
  setOutbox(outbox);
}

async function syncOutbox() {
  if (!USE_FIREBASE_DIRECT || !navigator.onLine) {
    return false;
  }

  const outbox = getOutbox();
  if (!outbox.length) {
    return true;
  }

  const remaining = [];
  for (const op of outbox) {
    try {
      if (op.type === "upsert" && op.item?.id) {
        const response = await fetch(firebaseBirthdaysUrl(op.item.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op.item),
        });
        if (!response.ok) {
          throw new Error(String(response.status));
        }
      } else if (op.type === "delete" && op.id) {
        const response = await fetch(firebaseBirthdaysUrl(op.id), {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error(String(response.status));
        }
      }
    } catch (_error) {
      remaining.push(op);
    }
  }

  setOutbox(remaining);
  return remaining.length === 0;
}

function setStatus(message, isError = false, showSuccessIcon = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", isError);
  if (!statusIconNode) {
    return;
  }
  if (showSuccessIcon && !isError) {
    statusIconNode.classList.remove("show");
    void statusIconNode.offsetWidth;
    statusIconNode.classList.add("show");
    return;
  }
  statusIconNode.classList.remove("show");
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
    listNode.appendChild(createBirthdayListItem(item));
  });
}

function createBirthdayListItem(item) {
  const li = document.createElement("li");
  li.className = "birthday-item";

  const text = document.createElement("span");
  text.textContent = `${item.name} — ${formatDateForUi(item.date)}`;
  li.appendChild(text);

  if (item.id) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-btn";
    removeButton.dataset.id = String(item.id);
    removeButton.textContent = "Удалить";
    li.appendChild(removeButton);
  }

  return li;
}

function renderBirthdayItem(item, append = false) {
  const li = createBirthdayListItem(item);
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

async function deleteBirthday(id) {
  if (!id) {
    throw new Error("Missing birthday id");
  }

  if (USE_FIREBASE_DIRECT) {
    const response = await fetch(firebaseBirthdaysUrl(id), {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Firebase delete error: ${response.status}`);
    }
    return;
  }

  const response = await fetch(apiUrl(`/api/birthdays/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Backend delete error: ${response.status}`);
  }
}

async function loadBirthdays() {
  if (USE_FIREBASE_DIRECT) {
    await syncOutbox();
  }

  if (USE_FIREBASE_DIRECT) {
    try {
      const response = await fetch(firebaseBirthdaysUrl());
      if (!response.ok) {
        throw new Error(`Firebase error: ${response.status}`);
      }
      const raw = await response.json();
      const items = raw
        ? Object.entries(raw).map(([id, value]) => ({
            id: value && value.id ? value.id : id,
            ...value,
          }))
        : [];
      items.sort((a, b) =>
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
      );
      setLocalCache(items);
      renderBirthdays(items);
      return;
    } catch (_error) {
      const cachedItems = getLocalCache();
      renderBirthdays(cachedItems);
      setStatus(
        "Оффлайн режим: показываю локальные данные. При появлении сети синхронизирую.",
        true
      );
      return;
    }
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
      upsertLocalCacheItem(entry);
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

    setStatus(
      payload.message || `Добавлено: ${payload.name} (${payload.date})`,
      false,
      true
    );
    form.reset();
    dateInput.style.display = "block";
    monthDayInput.style.display = "none";
    renderBirthdayItem(payload, true);
  } catch (error) {
    if (USE_FIREBASE_DIRECT) {
      const offlineEntry = {
        id: Date.now().toString(),
        name,
        date,
        createdAt: new Date().toISOString(),
      };
      upsertLocalCacheItem(offlineEntry);
      pushOutbox({ type: "upsert", item: offlineEntry });
      renderBirthdayItem(offlineEntry, true);
      form.reset();
      dateInput.style.display = "block";
      monthDayInput.style.display = "none";
      setStatus("Сохранено офлайн. При подключении к сети отправлю в Firebase.");
    } else {
      setStatus(`Ошибка сети: ${error.message}`, true);
    }
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = originalText;
  }
});

listNode.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) {
    return;
  }
  const id = button.dataset.id;
  if (!id) {
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Удаляю...";
  setStatus("");

  try {
    await deleteBirthday(id);
    removeLocalCacheItem(id);
    await loadBirthdays();
    setStatus("Запись удалена.");
  } catch (error) {
    if (USE_FIREBASE_DIRECT) {
      removeLocalCacheItem(id);
      pushOutbox({ type: "delete", id: String(id) });
      await loadBirthdays();
      setStatus("Удалено офлайн. При подключении к сети синхронизирую.");
    } else {
      setStatus(`Ошибка удаления: ${error.message}`, true);
      button.disabled = false;
      button.textContent = originalText;
    }
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(() => {});
  });
}

window.addEventListener("online", () => {
  syncOutbox()
    .then(() => loadBirthdays())
    .catch(() => {});
});
