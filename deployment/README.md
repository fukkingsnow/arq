# ARQ Deployment Guide

Инструкции по развертыванию приложения ARQ на сервере с доменом arq-ai.ru.

## Предварительные требования

- Ubuntu 20.04+ (или совместимый)
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2 (для управления процессами)
- Certbot (для SSL сертификатов)

## IP адрес сервера

**VPS IP:** 62.113.110.182

## Шаг 1: Настройка DNS

Добавьте A-записи для домена arq-ai.ru в панели управления доменом:

```
@ IN A 62.113.110.182
www IN A 62.113.110.182
```

## Шаг 2: Установка Nginx конфигурации

```bash
# Копировать конфигурацию nginx
sudo cp deployment/nginx/arq-ai.ru.conf /etc/nginx/sites-available/arq-ai.ru

# Создать символическую ссылку
sudo ln -s /etc/nginx/sites-available/arq-ai.ru /etc/nginx/sites-enabled/

# Удалить default конфигурацию (опционально)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить nginx
sudo systemctl reload nginx
```

## Шаг 3: Установка SSL сертификата

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx -y

# Получить сертификат
sudo certbot --nginx -d arq-ai.ru -d www.arq-ai.ru
```

## Шаг 4: Запуск приложения

```bash
# Установить зависимости
npm install

# Собрать проект
npm run build

# Запустить с PM2
pm2 start dist/main.js --name arq-backend
pm2 save
pm2 startup
```

## Шаг 5: Проверка

После завершения установки, приложение должно быть доступно по адресам:

- http://arq-ai.ru (перенаправление на HTTPS)
- https://arq-ai.ru
- https://www.arq-ai.ru

## Управление приложением

```bash
# Перезапуск
pm2 restart arq-backend

# Остановка
pm2 stop arq-backend

# Просмотр логов
pm2 logs arq-backend

# Мониторинг
pm2 monit
```

## Обновление приложения

```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart
pm2 restart arq-backend
```

## Troubleshooting

### Проверка статуса nginx
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Проверка портов
```bash
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :8000
```

### Логи nginx
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
