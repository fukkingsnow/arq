#!/bin/sh
while true; do
  # Собираем метрики Alpine Linux
  CPU=$(top -bn1 | grep 'CPU:' | awk '{print $2}' | cut -d% -f1)
  RAM=$(free | grep Mem | awk '{print $3/$2 * 100.0}' | cut -d. -f1)
  
  # Записываем в JSON для фронтенда
  echo "{\"cpu\": \"$CPU\", \"ram\": \"$RAM\"}" > /app/dist/frontend/stats.json
  sleep 2
done
