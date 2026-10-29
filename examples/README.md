# Примеры

| Папка | Что делает |
|---|---|
| [`node/profile-card.mjs`](node/profile-card.mjs) | SVG-карточка профиля Senku для README на GitHub |
| [`node/new-episodes.mjs`](node/new-episodes.mjs) | Серии, которые вышли или выйдут за сутки |
| [`discord-bot`](discord-bot) | Discord-бот с командами `/anime` и `/senku` |
| [`python/senku.py`](python/senku.py) | Клиент на чистом Python без зависимостей + топ зрителей |

## Запуск

Сначала собери пакеты в корне репозитория:

```bash
npm install
npm run build
```

### Node

```bash
cd examples/node
npm install
node profile-card.mjs kage card.svg
node new-episodes.mjs
```

<img src="../docs/assets/profile-card-example.svg" width="495" alt="Пример карточки профиля">

### Discord-бот

```bash
cd examples/discord-bot
npm install
DISCORD_TOKEN=… DISCORD_APP_ID=… npm start
```

### Python

```bash
python examples/python/senku.py
```
