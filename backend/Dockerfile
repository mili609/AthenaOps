# ============================================================
# backend/Dockerfile
# ============================================================
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY src ./src
COPY ai-engine ../ai-engine

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/index.js"]
