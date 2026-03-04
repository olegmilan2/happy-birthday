const { google } = require("googleapis");
const {
  googleCalendarId,
  googleClientId,
  googleClientSecret,
  googleRefreshToken,
  timezone,
} = require("./config");

function getCalendarClient() {
  if (
    !googleCalendarId ||
    !googleClientId ||
    !googleClientSecret ||
    !googleRefreshToken
  ) {
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
  const startDate = new Date(`${birthdayIsoDate}T00:00:00`);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const start = startDate.toISOString().slice(0, 10);
  const end = endDate.toISOString().slice(0, 10);

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
  const response = await calendar.events.insert({
    calendarId: googleCalendarId,
    requestBody: event,
  });
  return response.data;
}

module.exports = {
  createBirthdayEvent,
};
