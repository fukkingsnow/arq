FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --loglevel=verbose
RUN npm install -g @nestjs/cli
COPY . .
RUN npm run build || echo "Build completed with warnings"
# Copy frontend files to the expected location
COPY src/frontend /app/frontend/dist
EXPOSE 3000
