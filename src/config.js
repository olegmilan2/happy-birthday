const path = require("path");
require("dotenv").config();

module.exports = {
  timezone: process.env.TIMEZONE || "Europe/Moscow",
  notifyCron: process.env.NOTIFY_CRON || "0 9 * * *",
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  googleCalendarId: process.env.GOOGLE_CALENDAR_ID,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  storageFilePath:
    process.env.STORAGE_FILE_PATH ||
    path.resolve(__dirname, "..", "data", "birthdays.json"),
};
