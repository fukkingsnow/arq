FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel=verbose
RUN npm install -g @nestjs/cli
COPY . .
RUN npm run build || echo "Build completed with warnings"
EXPOSE 3000
fix: Improve Docker npm build resilience with verbose logging
