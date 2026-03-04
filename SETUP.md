# Quick Setup (No Pain)

## 1) Что уже работает сейчас
- Сайт: `https://olegmilan2.github.io/happy-birthday/`
- Данные: Firebase RTDB (общая база для всех, кто открывает эту ссылку)
- Telegram: GitHub Actions workflow (`Telegram Birthday Reminders`)
- Расписание Telegram: каждый день в `12:00` по `Europe/Kyiv`

## 2) Где проверять, что всё живое
1. GitHub -> `Actions` -> `Telegram Birthday Reminders`
2. Run должен быть `green`
3. В логе шага `Send reminders` должно быть:
- `Sent: ...` (уведомление отправлено), или
- `No birthday notifications for today.` (просто нет дат на сегодня/завтра)

## 3) Секреты GitHub (обязательно)
В `Settings -> Secrets and variables -> Actions -> Repository secrets` должны быть:
- `TELEGRAM_BOT_TOKEN` (или `HAPPY`, workflow умеет fallback)
- `TELEGRAM_CHAT_ID` = `88590436`
- `FIREBASE_DATABASE_URL` = `https://happy-birthday-ca27d-default-rtdb.firebaseio.com`

## 4) Как быстро проверить Telegram прямо сейчас
1. Открой GitHub -> `Actions`
2. Запусти `Telegram Birthday Reminders` через `Run workflow`
3. Должно прийти сообщение в Telegram

## 5) Если снова ошибка
- `Missing required env: TELEGRAM_BOT_TOKEN`
  - Секрет не создан или имя неправильное
- `Telegram send failed: 404 Not Found`
  - Токен невалидный/старый -> перевыпусти в `@BotFather`
- `FIREBASE_DATABASE_URL` пустой
  - Добавь/проверь URL в `Repository secrets`

## 6) Как работает добавление/удаление дат
- Добавление и удаление из браузера идет прямо в Firebase
- Все пользователи на твоей ссылке видят одни и те же данные

## 7) Если хочешь отдельную базу для другого человека
1. Fork репозитория
2. Свой Firebase проект
3. Свой `FIREBASE_DB_URL` в `config.js`
4. Свой GitHub Pages
