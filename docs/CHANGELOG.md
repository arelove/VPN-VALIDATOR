# Changelog

## [1.0.0] --- 2026-04-08

### Добавлено

- Инициализация проекта: package.json, tsconfig.json
- Файл system.log с имитацией syslog-логов хоста VPN-gateway
- Парсер src/parse.ts: фильтрация, regex-разбор, типы событий LOGIN/LOGOUT/WARN/ERROR
- Типизация: интерфейс VpnEvent, типы EventType и EventLevel
- docker-compose.yml с PostgreSQL 16 Alpine
- .env / .env.example для конфигурации подключения
