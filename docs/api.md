# Публичное API Senku

Senku API v2 — тот же REST API, на котором работают сайт и приложения. Открытые методы можно использовать в своих ботах, виджетах и приложениях.

- Базовый адрес: `https://senku.one/api/v2`
- Интерактивная документация (Swagger): [senku.one/api/v2/docs](https://senku.one/api/v2/docs)
- Готовый клиент на TypeScript: [`@senku/api`](../packages/api)

## Формат ответа

Каждый ответ — JSON-обёртка:

```json
{ "ok": true, "data": { "...": "..." } }
```

Ошибка:

```json
{ "ok": false, "error": { "code": "not_found", "message": "User not found" } }
```

| HTTP | `code` | Что значит |
|---|---|---|
| 400 | `bad_request` | Неверные параметры |
| 401 | `auth_required` | Метод только для вошедших |
| 403 | `adult_required`, `forbidden` | Нет доступа |
| 404 | `not_found`, `no_route` | Нет такого объекта или метода |
| 429 | `rate_limited` | Слишком часто — подожди и повтори |
| 5xx | — | Временная ошибка, можно повторить |

## Правила

1. **Указывай User-Agent** со способом связаться с тобой, например `MyBot/1.0 (+https://t.me/mybot)`. Запросы со стандартными агентами библиотек (например, `python-requests`) блокируются.
2. **Не чаще нескольких запросов в секунду.** Кэшируй ответы: каталог и карточки тайтлов меняются редко.
3. **CORS закрыт.** Обращайся к API с сервера, из бота или приложения, а не из браузера на чужом сайте.
4. Видео, источники плееров и раздел 18+ не предназначены для сторонних клиентов.

## Открытые методы

### Аниме

| Метод | Что возвращает |
|---|---|
| `GET /anime?page=&limit=&order=&genre=&status=&kind=&search=` | Страница каталога `{results, has_more}` |
| `GET /anime/{id}` | Карточка тайтла: названия, описание, жанры, кадры |
| `GET /anime/{id}/rating` | Оценка зрителей Senku и гистограмма 1–5 |
| `GET /anime/{id}/logos` | Прозрачные логотипы тайтла (ja / en) |
| `GET /anime/{id}/posters` | Постеры из MAL, AniList, Kitsu |
| `GET /anime/{id}/trailer` | Трейлер по качествам |
| `GET /search?q=` | Поиск по любому названию |
| `GET /schedule` | Расписание новых серий |
| `GET /voices` | Все команды озвучки и субтитров |

`id` тайтла совпадает с id на Shikimori.

### Люди

| Метод | Что возвращает |
|---|---|
| `GET /users/{id}` | Публичный профиль |
| `GET /users/0?username=` | Профиль по нику или короткой ссылке |
| `GET /users/{id}/stats` | Часы, серии, стрик, любимые жанры |
| `GET /users/{id}/favorites` | Списки |
| `GET /users/{id}/friends` | Друзья |
| `GET /users/{id}/cards` | Коллекционные карточки |
| `GET /users/{id}/reviews` | Рецензии |
| `GET /users/search?q=` | Поиск людей |
| `GET /top-users` | Топ зрителей |

### Рецензии и подборки

| Метод | Что возвращает |
|---|---|
| `GET /reviews/all?limit=&offset=` | Новые рецензии, до 30 за раз, `has_more` |
| `GET /reviews?anime_id=` | Рецензии тайтла |
| `GET /reviews/{id}` | Одна рецензия |
| `GET /collections?q=&sort=&limit=&offset=` | Публичные подборки |

### Служебное

| Метод | Что возвращает |
|---|---|
| `GET /health` | Состояние API |

## Вход

Методы, которые знают, кто ты (`/me`, личные списки), требуют токен. Его выдаёт `POST /auth/login` с `{login, password}`; дальше — заголовок `Authorization: Bearer <token>`. Не храни чужие пароли: для сторонних сервисов используй вход через браузер, а не пароль пользователя.

## Примеры

```bash
curl -A "MyBot/1.0 (+https://example.com)" "https://senku.one/api/v2/search?q=frieren"
```

```ts
import { Senku } from '@senku/api';

const senku = new Senku({ userAgent: 'MyBot/1.0 (+https://example.com)' });
const { results } = await senku.search('Фрирен');
const anime = await senku.anime.get(results[0].id);
```

Больше — в папке [`examples`](../examples).
