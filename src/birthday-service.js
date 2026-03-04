const { addBirthday } = require("./storage");
const { createBirthdayEvent, isCalendarConfigured } = require("./calendar");

function isValidDateParts(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function toMonthDay(month, day) {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeDate(inputDate) {
  const raw = String(inputDate || "").trim();
  const fullMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (fullMatch) {
    const year = Number(fullMatch[1]);
    const month = Number(fullMatch[2]);
    const day = Number(fullMatch[3]);
    if (!isValidDateParts(year, month, day)) {
      throw new Error("Некорректная дата.");
    }
    return raw;
  }

  const monthDayDash = /^(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (monthDayDash) {
    const month = Number(monthDayDash[1]);
    const day = Number(monthDayDash[2]);
    if (!isValidDateParts(2000, month, day)) {
      throw new Error("Некорректная дата без года.");
    }
    return toMonthDay(month, day);
  }

  const dayMonthDot = /^(\d{1,2})\.(\d{1,2})$/.exec(raw);
  if (dayMonthDot) {
    const day = Number(dayMonthDot[1]);
    const month = Number(dayMonthDot[2]);
    if (!isValidDateParts(2000, month, day)) {
      throw new Error("Некорректная дата без года.");
    }
    return toMonthDay(month, day);
  }

  throw new Error(
    "Некорректные данные. Используйте дату YYYY-MM-DD, MM-DD или DD.MM (например 02.04)."
  );
}

function validateDate(inputDate) {
  try {
    normalizeDate(inputDate);
    return true;
  } catch (_error) {
    return false;
  }
}

async function createAndStoreBirthday(name, date) {
  if (!name || !date) {
    throw new Error("Заполните имя и дату.");
  }
  const normalizedDate = normalizeDate(date);

  let event = null;
  let calendarEnabled = false;
  if (isCalendarConfigured()) {
    try {
      event = await createBirthdayEvent(name, normalizedDate);
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
    date: normalizedDate,
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
