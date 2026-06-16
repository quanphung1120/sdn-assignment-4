# Base stage
FROM node:22-bookworm AS base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
ENV NODE_ENV=development
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Builder stage
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8081
ENV HOST=0.0.0.0

# Copy dependency files first
COPY package*.json ./
RUN npm ci --only=production

# Copy built files and config files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/config ./config

# Run as non-root user for security
USER node

EXPOSE 8081
CMD ["node", "./dist/main.js"]
