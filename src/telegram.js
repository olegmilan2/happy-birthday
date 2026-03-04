const TelegramBot = require("node-telegram-bot-api");
const { telegramToken, telegramChatId } = require("./config");

let botInstance = null;

function getBot() {
  if (!telegramToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  if (!botInstance) {
    botInstance = new TelegramBot(telegramToken, { polling: false });
  }
  return botInstance;
}

async function sendTelegramMessage(message) {
  if (!telegramChatId) {
    throw new Error("TELEGRAM_CHAT_ID is not set");
  }
  const bot = getBot();
  await bot.sendMessage(telegramChatId, message);
}

module.exports = {
  sendTelegramMessage,
};
