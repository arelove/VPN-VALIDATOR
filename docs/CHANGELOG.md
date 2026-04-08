# Changelog

## [2.0.0] --- 2026-04-08

### Добавлено

- Next.js 15 dashboard (dashboard/) на App Router + TypeScript
- Три страницы: / (дашборд), /events (события), /chart (аналитика)
- Компоненты: StatCards, SessionsTable, EventsTable, UserBarChart
- Типизированный API-клиент lib/api.ts с интерфейсами Session, VpnEvent, Stats
- Навигация с подсветкой активного роута через usePathname
- Поддержка тёмной темы через prefers-color-scheme
- CORS в Fastify (src/server.ts) для поддержки dashboard на порту 3001

### Исправлено

- Повторный запуск парсера больше не падает: добавлен ON CONFLICT DO NOTHING в INSERT events

---

## [1.2.0] --- 2026-04-08

### Добавлено

- Fastify API сервер (src/server.ts)
- GET /api/sessions — список сессий с именами пользователей
- GET /api/events — все события
- GET /api/stats — сводная статистика

---

## [1.1.1] --- 2026-04-08

### Исправлено

- Дублирование событий в таблице events при повторном запуске парсера
- Добавлены уникальные индексы idx_events_unique и idx_events_system_unique

## [1.1.0] --- 2026-04-08

### Добавлено

- Подключение к PostgreSQL через pg.Pool (src/db.ts)
- Таблицы users, events, sessions с CREATE TABLE IF NOT EXISTS
- Upsert пользователей через ON CONFLICT (username) DO UPDATE

---

## [1.0.0] --- 2026-04-08

### Добавлено

- Инициализация проекта: package.json, tsconfig.json
- Файл system.log с имитацией syslog-логов хоста VPN-gateway
- Парсер src/parse.ts: фильтрация, regex-разбор, типы событий LOGIN/LOGOUT/WARN/ERROR
- Типизация: интерфейс VpnEvent, типы EventType и EventLevel
- docker-compose.yml с PostgreSQL 16 Alpine
- .env / .env.example для конфигурации подключения
