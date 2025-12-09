# Развёртывание ARQ Backend на Beget Хостинге

## Часть 1: Подготовка на Beget

### Шаг 1: Получить учётные данные БД

1. Откройте панель управления Beget
2. Перейдите в раздел "Базы данных"
3. Создайте новую БД PostgreSQL или MySQL
4. Получите credentials:
   - `DB_HOST` - хост базы данных
   - `DB_PORT` - порт (обычно 5432 для PostgreSQL, 3306 для MySQL)
   - `DB_USERNAME` - имя пользователя
   - `DB_PASSWORD` - пароль
   - `DB_NAME` - имя базы данных

### Шаг 2: Развернуть приложение

1. Загрузите код приложения на сервер Beget:
   ```bash
   git clone https://github.com/fukkingsnow/arq.git
   cd arq
   npm install
   ```

2. Создайте `.env` файл с учётными данными Beget:
   ```env
   DB_HOST=mysql123.beget.com
   DB_PORT=3306
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://your-domain.com
   ```

3. Запустите приложение:
   ```bash
   npm run build
   npm run start:prod
   ```

4. Или используйте PM2 для управления процессом:
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name "arq-api"
   pm2 startup
   pm2 save
   ```

## Часть 2: Конфигурация API в Postman Web

### Шаг 1: Обновить базовый URL

1. Откройте Postman Web
2. В коллекции "ARQ" найдите переменную окружения `{{baseURL}}`
3. Измените её значение на URL вашего Beget приложения:
   ```
   https://your-domain.com
   ```
   или
   ```
   https://your-beget-domain.com
   ```

### Шаг 2: Обновить переменные окружения

1. Нажмите на кнопку "Environments" в левой панели
2. Выберите или создайте новую окружение "Production"
3. Установите следующие переменные:

```json
{
  "baseURL": "https://your-domain.com",
  "apiVersion": "v1",
  "token": "",
  "userId": ""
}
```

### Шаг 3: Тестировать API endpoints

**1. Register User (первый запрос):**

METHOD: POST
URL: `{{baseURL}}/api/{{apiVersion}}/auth/register`
Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "firstName": "Test",
  "lastName": "User"
}
```

Ответ:
```json
{
  "id": "user-id",
  "email": "test@example.com",
  "token": "jwt-token"
}
```

Сохраните `token` в переменную `{{token}}`

**2. Login:**

METHOD: POST
URL: `{{baseURL}}/api/{{apiVersion}}/auth/login`
Body (JSON):
```json
{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

**3. Create Browser Session:**

METHOD: POST
URL: `{{baseURL}}/api/{{apiVersion}}/browser/sessions`
Headers:
```
Authorization: Bearer {{token}}
Content-Type: application/json
```
Body (JSON):
```json
{
  "userAgent": "Mozilla/5.0",
  "screenResolution": "1920x1080"
}
```

**4. List Sessions:**

METHOD: GET
URL: `{{baseURL}}/api/{{apiVersion}}/sessions`
Headers:
```
Authorization: Bearer {{token}}
```

## Часть 3: Настройка доменного имени

### Вариант 1: Использовать поддомен Beget

Обычно это уже настроено автоматически:
```
https://yourusername.beget.com
```

### Вариант 2: Использовать собственный домен

1. В панели Beget перейдите в "Домены"
2. Добавьте ваш домен
3. Обновите DNS записи согласно инструкциям Beget
4. Установите SSL сертификат (обычно бесплатный Let's Encrypt)

## Часть 4: Настройка CORS

Если вы планируете использовать фронтенд, обновите `.env`:

```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

Или разрешите все источники (только для разработки):

```env
CORS_ORIGIN=*
```

## Мониторинг и логирование

### Просмотр логов PM2:

```bash
pm2 logs arq-api
pm2 logs arq-api --lines 100
pm2 logs arq-api --err
```

### Перезагрузка приложения:

```bash
pm2 restart arq-api
pm2 stop arq-api
pm2 start arq-api
```

## Отладка проблем

### Приложение не запускается:

1. Проверьте `.env` файл
2. Проверьте подключение к БД
3. Просмотрите логи: `pm2 logs arq-api`

### Ошибки подключения к БД:

1. Проверьте credentials в `.env`
2. Убедитесь, что БД создана на Beget
3. Проверьте права доступа пользователя БД

### API возвращает ошибки CORS:

1. Проверьте URL в переменной `{{baseURL}}`
2. Обновите `CORS_ORIGIN` в `.env`
3. Перезагрузите приложение

## Полезные команды Beget SSH

```bash
# Проверить версию Node.js
node --version

# Проверить версию npm
npm --version

# Просмотреть логи приложения
tail -f /path/to/logs/app.log

# Проверить занятые порты
lsof -i :3000

# Рестарт nginx (если используется)
sudo systemctl restart nginx
```

## Полезные ссылки

- [Документация Beget](https://beget.com/ru/help)
- [Управление БД на Beget](https://beget.com/ru/help/databases)
- [Документация NestJS](https://docs.nestjs.com)
- [Документация Postman](https://learning.postman.com)
