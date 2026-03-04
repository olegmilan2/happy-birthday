function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function extractMonthDay(isoDate) {
  const [, month, day] = isoDate.split("-");
  return { month: Number(month), day: Number(day) };
}

function matchesBirthdayOnDate(birthdayIsoDate, targetDate) {
  const { month, day } = extractMonthDay(birthdayIsoDate);
  const targetMonth = targetDate.getMonth() + 1;
  const targetDay = targetDate.getDate();

  if (month === 2 && day === 29 && !isLeapYear(targetDate.getFullYear())) {
    return targetMonth === 2 && targetDay === 28;
  }

  return month === targetMonth && day === targetDay;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toHumanDate(date) {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

module.exports = {
  addDays,
  matchesBirthdayOnDate,
  toHumanDate,
};
