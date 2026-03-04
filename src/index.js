const { loadBirthdays } = require("./storage");
const { checkAndNotify, startScheduler } = require("./scheduler");
const { createAndStoreBirthday, validateDate } = require("./birthday-service");

function printUsage() {
  console.log(`
Usage:
  npm run add -- "Имя" YYYY-MM-DD
  npm run list
  npm start
`);
}

async function handleAdd(name, date) {
  if (!name || !date || !validateDate(date)) {
    printUsage();
    process.exit(1);
  }

  const { event, calendarEnabled } = await createAndStoreBirthday(name, date);

  console.log(`Добавлено: ${name} (${date})`);
  if (calendarEnabled && event) {
    console.log(`Событие в Google Calendar: ${event.htmlLink || event.id}`);
  } else {
    console.log(
      "Google Calendar не настроен: запись сохранена локально без события."
    );
  }
}

function handleList() {
  const items = loadBirthdays();
  if (items.length === 0) {
    console.log("Список пуст.");
    return;
  }

  for (const item of items) {
    console.log(`- ${item.name}: ${item.date}`);
  }
}

async function handleRun() {
  await checkAndNotify(new Date());
  startScheduler();
  console.log("Сервис запущен. Проверка уведомлений идет по cron-расписанию.");
}

async function main() {
  const [, , command, ...args] = process.argv;

  if (command === "add") {
    const [name, date] = args;
    await handleAdd(name, date);
    return;
  }

  if (command === "list") {
    handleList();
    return;
  }

  if (command === "run") {
    await handleRun();
    return;
  }

  printUsage();
}

main().catch((error) => {
  console.error("Ошибка:", error.message);
  process.exit(1);
});
