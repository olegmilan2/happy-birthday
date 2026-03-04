# Happy Birthday Manager

Умный менеджер дней рождения:
- вы добавляете имя и дату один раз;
- создается ежегодное событие в Google Calendar на 50 лет;
- бот Telegram присылает напоминание в личку в день рождения и за день до него.

## 1) Установка

```bash
npm install
cp .env.example .env
```

## 2) Настройка Telegram

1. Создайте бота через `@BotFather`, получите `TELEGRAM_BOT_TOKEN`.
2. Напишите боту хотя бы одно сообщение.
3. Узнайте свой `chat_id` (например, через `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`) и заполните `TELEGRAM_CHAT_ID`.

## 3) Настройка Google Calendar API

1. В Google Cloud включите `Google Calendar API`.
2. Создайте OAuth Client (`Desktop app` или `Web application`).
3. Получите `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
4. Укажите `GOOGLE_CALENDAR_ID`:
   - `primary` для основного календаря;
   - или email/ID конкретного календаря.

## 4) Запуск

Запустить web-приложение:

```bash
npm start
```

Откройте `http://localhost:3000` и добавляйте через форму.

## GitHub Pages + backend

Чтобы страница на GitHub Pages (`https://olegmilan2.github.io/happy-birthday/`) работала:

1. Разверните backend отдельно (например Render/Railway/Fly) с командой запуска `npm start`.
2. В корне репозитория в файле `config.js` заполните:

```js
window.APP_CONFIG = {
  API_BASE: "https://your-backend-domain.com",
};
```

3. Запушьте изменения в GitHub Pages.

После этого кнопка "Добавить" на GitHub Pages будет отправлять запросы в ваш backend.

CLI-режим (опционально), добавить день рождения:

```bash
npm run add -- "Иван" 1995-05-12
```

Список добавленных:

```bash
npm run list
```

Запуск сервиса уведомлений:

```bash
npm run worker
```

## Переменные окружения

- `PORT` - порт web-сервера (по умолчанию `3000`).
- `TIMEZONE` - временная зона (по умолчанию `Europe/Moscow`).
- `NOTIFY_CRON` - расписание ежедневной проверки (по умолчанию `0 9 * * *`).
- `TELEGRAM_BOT_TOKEN` - токен Telegram-бота.
- `TELEGRAM_CHAT_ID` - ваш личный chat_id для уведомлений.
- `GOOGLE_CALENDAR_ID` - календарь для создания событий.
- `GOOGLE_CLIENT_ID` - OAuth client id.
- `GOOGLE_CLIENT_SECRET` - OAuth client secret.
- `GOOGLE_REFRESH_TOKEN` - refresh token пользователя.
