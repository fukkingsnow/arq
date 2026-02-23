#!/bin/sh
echo '[SYS]: Полигон активен' > /app/task_processing.log
while true; do
  TASK_ID=$(psql -U arq -d arq_db -t -A -c "SELECT id FROM tasks WHERE description NOT LIKE '%🤖%' OR description IS NULL OR description = '' LIMIT 1;")
  if [ ! -z "$TASK_ID" ]; then
    TITLE=$(psql -U arq -d arq_db -t -A -c "SELECT title FROM tasks WHERE id='$TASK_ID';")
    GOAL=$(psql -U arq -d arq_db -t -A -c "SELECT goal FROM tasks WHERE id='$TASK_ID';")
    echo "[$(date +%T)] [META-ANALYSIS]: Исследование вектора $TITLE" >> /app/task_processing.log
    
    RAW_RES=$(curl -s http://arq-ollama:11434/api/generate -d "{\"model\":\"gemma2:2b\",\"prompt\":\"Ты ядро Метаплатформы. Задача: $GOAL. Если в заголовке есть AUTO, пиши ТОЛЬКО код shell. Иначе - дай научный анализ.\",\"stream\":false}" | jq -r '.response')

    if echo "$TITLE" | grep -q "AUTO"; then
        echo "[$(date +%T)] [SELF-IMPROVE]: Применение патча..." >> /app/task_processing.log
        echo "$RAW_RES" > /tmp/patch.sh && sh /tmp/patch.sh >> /app/task_processing.log 2>&1
        FINAL_DESC="✅ <b>AUTO-PATCH:</b><br><pre>$RAW_RES</pre>"
    else
        FINAL_DESC="🤖 <b>ANALYSIS:</b><br>$RAW_RES"
    fi
    psql -U arq -d arq_db -c "UPDATE tasks SET description='$FINAL_DESC' WHERE id='$TASK_ID';"
    cp /app/task_processing.log /app/dist/frontend/system.log
  fi
  sleep 5
done
