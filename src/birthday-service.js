const { addBirthday } = require("./storage");
const { createBirthdayEvent, isCalendarConfigured } = require("./calendar");

function validateDate(isoDate) {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoDate);
}

async function createAndStoreBirthday(name, date) {
  if (!name || !date || !validateDate(date)) {
    throw new Error("Некорректные данные. Используйте имя и дату YYYY-MM-DD.");
  }

  let event = null;
  let calendarEnabled = false;
  if (isCalendarConfigured()) {
    try {
      event = await createBirthdayEvent(name, date);
      calendarEnabled = true;
    } catch (error) {
      if (
        String(error.message).includes("Google Calendar config is incomplete")
      ) {
        calendarEnabled = false;
      } else {
        throw error;
      }
    }
  }

  const entry = {
    id: Date.now().toString(),
    name,
    date,
    calendarEventId: event ? event.id : null,
    calendarEnabled,
    createdAt: new Date().toISOString(),
  };

  addBirthday(entry);
  return { entry, event, calendarEnabled };
}

module.exports = {
  validateDate,
  createAndStoreBirthday,
};
