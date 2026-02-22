# ─── Stage 1: Dependencies ────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Collect better-sqlite3 and its runtime dependencies into a staging dir
RUN mkdir -p /tmp/native-deps && \
    for pkg in better-sqlite3 bindings file-uri-to-path prebuild-install node-addon-api; do \
      if [ -d "/app/node_modules/$pkg" ]; then \
        cp -r "/app/node_modules/$pkg" "/tmp/native-deps/$pkg"; \
      fi; \
    done

# ─── Stage 3: Production ─────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle migrations for DB init
COPY --from=builder /app/drizzle ./drizzle

# Copy better-sqlite3 native bindings (only modules that exist)
COPY --from=builder /tmp/native-deps/ ./node_modules/

# Create data directory for SQLite and set ownership
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Create startup script that initializes DB and starts the app
COPY --chown=nextjs:nodejs scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 8080

CMD ["./start.sh"]
