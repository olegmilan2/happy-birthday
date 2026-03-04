const { loadBirthdays } = require("../storage");
const { checkAndNotify, startScheduler } = require("../scheduler");
const { createAndStoreBirthday, validateDate } = require("../birthday-service");
const {
  getRecentChats,
  getMissingTelegramEnv,
  sendTelegramMessage,
} = require("../telegram");

function printUsage() {
  console.log(`
Usage:
  npm run add -- "Имя" YYYY-MM-DD
  npm run add -- "Имя" MM-DD
  npm run add -- "Имя" DD.MM
  npm run list
  npm run telegram:chat-id
  npm run telegram:test
  npm start
`);
}

async function handleAdd(name, date) {
  if (!name || !date || !validateDate(date)) {
    printUsage();
    process.exit(1);
  }

  const { event, calendarEnabled, entry } = await createAndStoreBirthday(
    name,
    date
  );

  console.log(`Добавлено: ${name} (${entry.date})`);
  if (calendarEnabled && event) {
    console.log(`Событие в Google Calendar: ${event.htmlLink || event.id}`);
    return;
  }
  console.log(
    "Google Calendar не настроен: запись сохранена локально без события."
  );
}

async function handleList() {
  const items = await loadBirthdays();
  if (items.length === 0) {
    console.log("Список пуст.");
    return;
  }

  for (const item of items) {
    console.log(`- ${item.name}: ${item.date}`);
  }
}

async function handleRun() {
  startScheduler();
  try {
    await checkAndNotify(new Date());
  } catch (error) {
    console.error("Проверка уведомлений при старте не удалась:", error.message);
  }
  console.log("Сервис запущен. Проверка уведомлений идет по cron-расписанию.");
}

async function handleTelegramChatId() {
  const missing = getMissingTelegramEnv().filter(
    (item) => item !== "TELEGRAM_CHAT_ID"
  );
  if (missing.length > 0) {
    throw new Error(
      `Не хватает переменных для запроса Telegram API: ${missing.join(", ")}`
    );
  }

  const chats = await getRecentChats();
  if (chats.length === 0) {
    console.log(
      "Обновлений не найдено. Напиши боту сообщение и повтори команду."
    );
    return;
  }

  console.log("Найденные чаты:");
  for (const chat of chats) {
    const name =
      chat.title ||
      [chat.firstName, chat.lastName].filter(Boolean).join(" ") ||
      chat.username ||
      "без имени";
    console.log(`- chat_id=${chat.id} type=${chat.type} name=${name}`);
  }
}

async function handleTelegramTest() {
  const missing = getMissingTelegramEnv();
  if (missing.length > 0) {
    throw new Error(
      `Telegram не настроен. Заполни в .env: ${missing.join(", ")}`
    );
  }

  const now = new Date().toISOString();
  await sendTelegramMessage(`Тест: бот подключен (${now})`);
  console.log("Тестовое сообщение отправлено.");
}

module.exports = {
  printUsage,
  handleAdd,
  handleList,
  handleRun,
  handleTelegramChatId,
  handleTelegramTest,
};
