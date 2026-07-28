# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json turbo.json ./
COPY apps/api-gateway/package.json apps/api-gateway/
COPY widgets/chat-widget/package.json widgets/chat-widget/
COPY packages/shared/package.json packages/shared/

# Install all dependencies
RUN npm ci

# Copy source code
COPY apps/api-gateway/ apps/api-gateway/
COPY widgets/chat-widget/ widgets/chat-widget/
COPY packages/shared/ packages/shared/
COPY data/ data/

# Build everything
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy built application
COPY --from=builder --chown=appuser:appgroup /app/apps/api-gateway/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/apps/api-gateway/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/widgets/chat-widget/dist ./widgets-dist
COPY --from=builder --chown=appuser:appgroup /app/data ./data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data/clients

EXPOSE 3000

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
