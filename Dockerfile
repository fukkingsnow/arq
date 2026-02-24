FROM node:22-alpine

WORKDIR /app

# Явно прописываем переменные внутри образа
ENV NODE_ENV=development
ENV DB_TYPE=postgres
ENV DB_HOST=arq-postgres
ENV DB_PORT=5432
ENV DB_USERNAME=arq
ENV DB_PASSWORD=arq_password
ENV DB_DATABASE=arq_db
ENV DATABASE_URL=postgresql://arq:arq_password@arq-postgres:5432/arq_db

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Собираем dist внутри образа
RUN npm run build

EXPOSE 8000

CMD ["node", "dist/main"]
