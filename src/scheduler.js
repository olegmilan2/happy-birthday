const cron = require("node-cron");
const { timezone, notifyCron } = require("./config");
const { loadBirthdays } = require("./storage");
const { addDays, matchesBirthdayOnDate, toHumanDate } = require("./date-utils");
const { sendTelegramMessage } = require("./telegram");

async function checkAndNotify(referenceDate = new Date()) {
  const birthdays = loadBirthdays();
  const tomorrow = addDays(referenceDate, 1);

  for (const person of birthdays) {
    const isToday = matchesBirthdayOnDate(person.date, referenceDate);
    const isTomorrow = matchesBirthdayOnDate(person.date, tomorrow);

    if (isToday) {
      await sendTelegramMessage(
        `Сегодня день рождения у ${person.name}! Не забудь поздравить.`
      );
    } else if (isTomorrow) {
      await sendTelegramMessage(
        `Завтра (${toHumanDate(tomorrow)}) день рождения у ${person.name}.`
      );
    }
  }
}

function startScheduler() {
  cron.schedule(
    notifyCron,
    async () => {
      try {
        await checkAndNotify(new Date());
      } catch (error) {
        console.error("Notification job failed:", error.message);
      }
    },
    { timezone }
  );
}

module.exports = {
  checkAndNotify,
  startScheduler,
};
