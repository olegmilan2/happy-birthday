const { addDays, matchesBirthdayOnDate, toHumanDate } = require("../src/date-utils");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function fetchBirthdays(databaseUrl) {
  const url = `${databaseUrl.replace(/\/+$/, "")}/birthdays.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Firebase request failed: ${response.status}`);
  }
  const raw = await response.json();
  return raw ? Object.values(raw) : [];
}

async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram send failed: ${response.status} ${body}`);
  }
}

async function main() {
  const telegramToken = requireEnv("TELEGRAM_BOT_TOKEN");
  const telegramChatId = requireEnv("TELEGRAM_CHAT_ID");
  const firebaseDatabaseUrl = requireEnv("FIREBASE_DATABASE_URL");
  const forceTest = String(process.env.FORCE_TEST || "").toLowerCase() === "true";

  const now = new Date();
  const tomorrow = addDays(now, 1);
  const birthdays = await fetchBirthdays(firebaseDatabaseUrl);

  const messages = [];
  for (const person of birthdays) {
    if (!person?.name || !person?.date) {
      continue;
    }

    const isToday = matchesBirthdayOnDate(person.date, now);
    const isTomorrow = matchesBirthdayOnDate(person.date, tomorrow);

    if (isToday) {
      messages.push(
        `Сегодня день рождения у ${person.name}! Не забудь поздравить.`
      );
    } else if (isTomorrow) {
      messages.push(
        `Завтра (${toHumanDate(tomorrow)}) день рождения у ${person.name}.`
      );
    }
  }

  if (messages.length === 0) {
    if (forceTest) {
      await sendTelegramMessage(
        telegramToken,
        telegramChatId,
        `Тест: workflow запущен, дат на сегодня/завтра нет (${toHumanDate(now)}).`
      );
      console.log("Sent test message (force mode).");
      return;
    }
    console.log("No birthday notifications for today.");
    return;
  }

  for (const text of messages) {
    await sendTelegramMessage(telegramToken, telegramChatId, text);
    console.log(`Sent: ${text}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
