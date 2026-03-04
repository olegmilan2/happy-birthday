const { google } = require("googleapis");
const {
  googleCalendarId,
  googleClientId,
  googleClientSecret,
  googleRefreshToken,
  timezone,
} = require("./config");

function isCalendarConfigured() {
  const hasValue = (v) => {
    if (typeof v !== "string") {
      return false;
    }
    const normalized = v.trim().toLowerCase();
    return Boolean(normalized) && normalized !== "null" && normalized !== "...";
  };

  return Boolean(
    hasValue(googleCalendarId) &&
      hasValue(googleClientId) &&
      hasValue(googleClientSecret) &&
      hasValue(googleRefreshToken)
  );
}

function getCalendarClient() {
  if (!isCalendarConfigured()) {
    throw new Error(
      "Google Calendar config is incomplete. Check GOOGLE_CALENDAR_ID/GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN"
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    googleClientId,
    googleClientSecret
  );
  oauth2Client.setCredentials({
    refresh_token: googleRefreshToken,
  });

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}

function createRecurringEventPayload(name, birthdayIsoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdayIsoDate);
  if (!match) {
    throw new Error("Дата должна быть в формате YYYY-MM-DD.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const startDateUtc = new Date(Date.UTC(year, month - 1, day));
  if (
    startDateUtc.getUTCFullYear() !== year ||
    startDateUtc.getUTCMonth() !== month - 1 ||
    startDateUtc.getUTCDate() !== day
  ) {
    throw new Error("Некорректная дата.");
  }

  const endDateUtc = new Date(startDateUtc);
  endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 1);

  const start = startDateUtc.toISOString().slice(0, 10);
  const end = endDateUtc.toISOString().slice(0, 10);

  return {
    summary: `День рождения: ${name}`,
    description: `Автособытие для напоминания о дне рождения ${name}.`,
    start: {
      date: start,
      timeZone: timezone,
    },
    end: {
      date: end,
      timeZone: timezone,
    },
    recurrence: ["RRULE:FREQ=YEARLY;COUNT=50"],
  };
}

async function createBirthdayEvent(name, birthdayIsoDate) {
  const calendar = getCalendarClient();
  const event = createRecurringEventPayload(name, birthdayIsoDate);
  try {
    const response = await calendar.events.insert({
      calendarId: googleCalendarId,
      requestBody: event,
    });
    return response.data;
  } catch (error) {
    const apiMessage =
      error?.response?.data?.error?.message ||
      error?.errors?.[0]?.message ||
      error.message;

    if (String(apiMessage).includes("expected pattern")) {
      throw new Error(
        "Google Calendar отклонил значение. Проверьте GOOGLE_CALENDAR_ID (обычно `primary`) и дату в формате YYYY-MM-DD."
      );
    }

    throw new Error(`Google Calendar error: ${apiMessage}`);
  }
}

module.exports = {
  createBirthdayEvent,
  isCalendarConfigured,
};
