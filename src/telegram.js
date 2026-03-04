const TelegramBot = require("node-telegram-bot-api");
const { telegramToken, telegramChatId } = require("./config");

let botInstance = null;

function getMissingTelegramEnv() {
  const missing = [];
  if (!telegramToken) {
    missing.push("TELEGRAM_BOT_TOKEN");
  }
  if (!telegramChatId) {
    missing.push("TELEGRAM_CHAT_ID");
  }
  return missing;
}

function isTelegramConfigured() {
  return getMissingTelegramEnv().length === 0;
}

function wrapTelegramError(error, action) {
  const message = String(error?.message || "");

  if (error?.code === "ENOTFOUND" || message.includes("ENOTFOUND api.telegram.org")) {
    return new Error(
      `Не удалось подключиться к api.telegram.org во время "${action}". Проверь интернет/доступ к Telegram API.`
    );
  }
  if (error?.response?.statusCode === 401 || message.includes("401 Unauthorized")) {
    return new Error(
      `Telegram вернул 401 во время "${action}". Проверь TELEGRAM_BOT_TOKEN.`
    );
  }
  if (error?.response?.statusCode === 400 || message.includes("400 Bad Request")) {
    return new Error(
      `Telegram вернул 400 во время "${action}". Проверь TELEGRAM_CHAT_ID и токен.`
    );
  }
  return error;
}

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
  const missing = getMissingTelegramEnv();
  if (missing.length > 0) {
    throw new Error(
      `Telegram is not configured. Missing: ${missing.join(", ")}`
    );
  }
  const bot = getBot();
  try {
    await bot.sendMessage(telegramChatId, message);
  } catch (error) {
    throw wrapTelegramError(error, "sendMessage");
  }
}

async function getRecentChats(limit = 20) {
  if (!telegramToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  const bot = getBot();
  let updates;
  try {
    updates = await bot.getUpdates({ limit, timeout: 0 });
  } catch (error) {
    throw wrapTelegramError(error, "getUpdates");
  }
  const chatsById = new Map();

  for (const update of updates) {
    const chat = update.message?.chat;
    if (!chat?.id) {
      continue;
    }
    chatsById.set(chat.id, {
      id: chat.id,
      type: chat.type,
      title: chat.title || null,
      username: chat.username || null,
      firstName: chat.first_name || null,
      lastName: chat.last_name || null,
    });
  }

  return Array.from(chatsById.values());
}

module.exports = {
  getMissingTelegramEnv,
  isTelegramConfigured,
  getRecentChats,
  sendTelegramMessage,
};
