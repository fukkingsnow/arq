# PostgreSQL Database Setup для ARQ Backend

## Шаг 1: Подключиться к PostgreSQL

### На Windows (cmd или PowerShell):
```bash
psql -U postgres
```

### На Linux/Mac:
```bash
sudo -u postgres psql
```

## Шаг 2: Создать пользователя arquser

В интерпретаторе PostgreSQL выполните следующие команды:

```sql
-- Создать пользователя с паролем
CREATE USER arquser WITH PASSWORD 'arquser_password';

-- Создать базу данных
CREATE DATABASE arq OWNER arquser;

-- Дать все привилегии
GRANT ALL PRIVILEGES ON DATABASE arq TO arquser;

-- Подключиться к базе
\c arq

-- Дать схемные привилегии
GRANT ALL PRIVILEGES ON SCHEMA public TO arquser;

-- Выйти
\q
```

## Шаг 3: Обновить переменные окружения

Откройте файл `.env` в `D:\arq-backend` и установите:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=arquser
DB_PASSWORD=arquser_password
DB_NAME=arq
```

## Шаг 4: Запустить приложение

```bash
npm run start:dev
```

## Важные команды PostgreSQL

```sql
-- Список всех пользователей
\du

-- Список всех баз данных
\l

-- Подключиться к базе
\c arq

-- Список таблиц
\dt

-- Выйти из psql
\q
```

## Если нужно переустановить

```sql
-- Удалить базу
DROP DATABASE IF EXISTS arq;

-- Удалить пользователя
DROP USER IF EXISTS arquser;

-- Пересоздать (см. выше)
```

## Для облачного хостинга (Beget)

Вместо локального PostgreSQL используйте облачную БД от хостинга:

1. Создайте БД в панели управления Beget
2. Получите credentials (host, user, password, database)
3. Обновите `.env`:

```env
DB_HOST=your-beget-host.com
DB_PORT=3306  # или 5432 в зависимости от провайдера
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```
