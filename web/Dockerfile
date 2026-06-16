# Base stage
FROM node:22-bookworm AS base
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./

# Development stage
FROM base AS development
RUN pnpm install
COPY . .
ENV NODE_ENV=development
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]

# Builder stage
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Production stage
FROM nginx:1.27-bookworm AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
