# Happy Birthday Manager

Frontend (GitHub Pages): https://olegmilan2.github.io/happy-birthday/

Умный менеджер дней рождения:
- вы добавляете имя и дату один раз;
- если год неизвестен, можно добавить только день и месяц (`DD.MM`, например `02.04`);
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
3. Узнайте свой `chat_id`:

```bash
npm run telegram:chat-id
```

4. Заполните в `.env`:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

5. Проверьте отправку тестового сообщения:

```bash
npm run telegram:test
```

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

## Общая БД для всех (Firebase Realtime Database)

По умолчанию данные сохраняются в локальный `data/birthdays.json`.
Чтобы все пользователи видели одни и те же данные, подключите Firebase RTDB:

1. В Firebase Console создайте проект и включите `Realtime Database`.
2. `Project settings -> Service accounts -> Generate new private key`.
3. Заполните в `.env`:
   - `FIREBASE_DATABASE_URL` (например `https://<project>-default-rtdb.firebaseio.com/`)
   - `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
4. Скопируйте `serviceAccountKey.json` в корень проекта (файл уже в `.gitignore`).
5. Перезапустите сервер (`npm start`).

После этого новые записи сохраняются в общей RTDB-ветке `birthdays`.
Фронт автоматически обновляет список каждые 15 секунд, поэтому изменения видны всем.

CLI-режим (опционально), добавить день рождения:

```bash
npm run add -- "Иван" 1995-05-12
npm run add -- "Иван" 05-12
npm run add -- "Иван" 02.04
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
- `FIREBASE_PROJECT_ID` - id Firebase-проекта для общей БД.
- `FIREBASE_CLIENT_EMAIL` - client_email из service account JSON.
- `FIREBASE_PRIVATE_KEY` - private_key из service account JSON (с `\n`).
- `FIREBASE_DATABASE_URL` - URL Realtime Database.
- `FIREBASE_SERVICE_ACCOUNT_PATH` - путь к service account JSON (предпочтительный способ).
