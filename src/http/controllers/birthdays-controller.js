const { loadBirthdays } = require("../../storage");
const { createAndStoreBirthday } = require("../../birthday-service");

async function getBirthdays(_req, res) {
  try {
    const items = await loadBirthdays();
    res.json(items);
  } catch (error) {
    console.error("GET /api/birthdays failed:", error.message);
    res.status(500).json({ error: "Не удалось загрузить дни рождения." });
  }
}

async function createBirthday(req, res) {
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
}

module.exports = {
  getBirthdays,
  createBirthday,
};
