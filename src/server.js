const path = require("path");
const express = require("express");
const cors = require("cors");
const { port } = require("./config");
const { loadBirthdays } = require("./storage");
const { createAndStoreBirthday } = require("./birthday-service");
const { checkAndNotify, startScheduler } = require("./scheduler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "..")));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/birthdays", (_req, res) => {
  res.json(loadBirthdays());
});

app.post("/api/birthdays", async (req, res) => {
  const { name, date } = req.body || {};

  try {
    const { entry, event, calendarEnabled } = await createAndStoreBirthday(
      name,
      date
    );
    res.status(201).json({
      ...entry,
      calendarLink: event ? event.htmlLink || null : null,
      message: calendarEnabled
        ? "Добавлено и синхронизировано с Google Calendar."
        : "Добавлено локально. Для синхронизации с Google Calendar заполните переменные в .env.",
    });
  } catch (error) {
    console.error("POST /api/birthdays failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, async () => {
  console.log(`Web UI: http://localhost:${port}`);
  try {
    await checkAndNotify(new Date());
    startScheduler();
  } catch (error) {
    console.error("Scheduler bootstrap failed:", error.message);
  }
});
