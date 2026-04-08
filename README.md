# VPN-VALIDATOR

Парсер и дашборд для анализа логов VPN-агента.

## Стек

- **Backend:** Node.js, TypeScript, Fastify, PostgreSQL
- **Frontend:** Next.js 15, TypeScript
- **Инфраструктура:** Docker Compose

## Запуск

### 1. База данных

```bash
docker-compose up -d
```

### 2. Переменные окружения

```bash
cp .env.example .env
```

### 3. Парсер — читает system.log, создаёт таблицы и заливает данные

```bash
npm install
npm run parse
```

### 4. API сервер

```bash
npm run server
```

### 5. Дашборд

```bash
cd dashboard
npm install
npm run dev

Открыть: http://localhost:3001
```

## Структура

```bash
src/
  parseUtils.ts   — парсинг строк syslog (фильтрация, regex, типы событий)
  parse.ts        — чтение файла и запись в БД
  server.ts       — Fastify API (sessions, events, stats)
  db.ts           — подключение к PostgreSQL, схема БД
dashboard/        — Next.js дашборд
system.log        — имитация логов VPN-агента
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /api/sessions | Список сессий с длительностью |
| GET | /api/events | Все события VPN-агента |
| GET | /api/stats | Сводная статистика |
