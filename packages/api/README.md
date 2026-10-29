# @senku/api

TypeScript-клиент для публичного API [Senku](https://senku.one). Без зависимостей, работает в Node 18+, Deno, Bun и Cloudflare Workers.

- Типы для всех ответов
- Повтор при сетевых ошибках, 429 и 5xx с паузой
- Тайм-аут на запрос
- Кэш одинаковых запросов в памяти (по желанию)
- Обход всех страниц через `for await`

## Установка

Пакет пока не опубликован в npm. Подключение из репозитория:

```bash
git clone https://github.com/Ra9ge/Uw.Senku.Site.git
cd Uw.Senku.Site && npm install && npm run build
```

```json
{ "dependencies": { "@senku/api": "file:../Uw.Senku.Site/packages/api" } }
```

## Быстрый старт

```ts
import { Senku } from '@senku/api';

const senku = new Senku({ userAgent: 'MyBot/1.0 (+https://t.me/mybot)' });

const { results } = await senku.search('Фрирен');
const anime = await senku.anime.get(results[0].id);
console.log(anime.title, anime.year, anime.genres);

const user = await senku.users.get('kage');
const stats = await senku.users.stats(user.id);
console.log(`${user.username}: ${stats.stats.watch_hours} ч, уровень ${stats.level}`);

for await (const review of senku.reviews.iterate()) {
  console.log(review.target_title, review.rating);
}
```

## Методы

| Вызов | API |
|---|---|
| `anime.list(params)` | `GET /anime` |
| `anime.iterate(params, maxPages)` | все страницы `GET /anime` |
| `anime.get(id)` | `GET /anime/{id}` |
| `anime.rating(id)` | `GET /anime/{id}/rating` |
| `anime.logos(id)` / `posters(id)` / `trailer(id)` | картинки и трейлер |
| `search(q)` | `GET /search` |
| `schedule()` | `GET /schedule` |
| `reviews.all({ limit, offset })` / `iterate()` | `GET /reviews/all` |
| `reviews.forAnime(id)` / `get(id)` | рецензии тайтла / одна |
| `users.get(idOrNick)` | профиль |
| `users.stats` / `favorites` / `friends` / `cards` / `reviews` | данные профиля |
| `users.search(q)` / `users.top()` | поиск и топ |
| `collections.list()` / `get(id)` | подборки |
| `voices()` | озвучки |
| `health()` | состояние API |

## Настройки

```ts
new Senku({
  baseUrl: 'https://senku.one/api/v2',
  token: '…',          // если нужны методы для вошедших
  userAgent: 'MyApp/1.0',
  timeoutMs: 15_000,
  retries: 2,
  cacheTtlMs: 60_000,
  fetch: customFetch,
});
```

## Ошибки

```ts
import { SenkuError } from '@senku/api';

try {
  await senku.users.get('нет-такого');
} catch (e) {
  if (e instanceof SenkuError && e.isNotFound) console.log('Нет такого пользователя');
}
```

У ошибки есть `status`, `code`, `message`, а также `isNotFound`, `isRateLimited`, `isRetryable`.

## Разработка

```bash
npm run typecheck
npm test
npm run build
```

Лицензия MIT.
