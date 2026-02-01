FROM dhi.io/node:24-alpine3.23-dev AS builder

WORKDIR /app

ARG BUILD=oss
ARG DATABASE=sqlite

# Install build dependencies
RUN apk add --no-cache \
    g++ \
    make \
    python3

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build application
RUN if [ "$BUILD" = "oss" ]; then rm -rf server/private; fi && \
    npm run set:$DATABASE && \
    npm run set:$BUILD && \
    npm run db:$DATABASE:generate && \
    npm run build:$DATABASE && \
    npm run build:cli && \
    test -f dist/server.mjs

FROM dhi.io/node:24-alpine3.23-dev AS runner

WORKDIR /app

# Install runtime dependencies and install production node_modules
RUN apk add --no-cache \
    g++ \
    make \
    python3 \
    tzdata

COPY package*.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

FROM dhi.io/node:24-alpine3.23

# OCI Image Labels - Build Args for dynamic values
ARG VERSION="dev"
ARG REVISION=""
ARG CREATED=""
ARG LICENSE="AGPL-3.0"
ARG IMAGE_TITLE="Pangolin"
ARG IMAGE_DESCRIPTION="Identity-aware VPN and proxy for remote access to anything, anywhere"

ENV ENVIRONMENT=prod
ENV NODE_ENV=development

WORKDIR /app

# Copy package.json
COPY --chown=node:node package.json ./

# Copy pre-built node_modules and timezone data from runner stage
COPY --from=runner /app/node_modules ./node_modules
COPY --from=runner /usr/share/zoneinfo /usr/share/zoneinfo

# Copy built artifacts from builder stage
COPY --chown=node:node --from=builder /app/.next/standalone ./
COPY --chown=node:node --from=builder /app/.next/static ./.next/static
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/server/migrations ./dist/init

COPY --chown=node:node --chmod=+x ./cli/wrapper.sh /usr/local/bin/pangctl
COPY --chown=node:node server/db/names.json server/db/*_models.json ./dist/
COPY --chown=node:node public ./public
COPY --chown=node:node --chmod=+x entrypoint.sh /entrypoint.sh

# OCI Image Labels
LABEL org.opencontainers.image.source="https://github.com/fosrl/pangolin" \
      org.opencontainers.image.url="https://github.com/fosrl/pangolin" \
      org.opencontainers.image.documentation="https://docs.pangolin.net" \
      org.opencontainers.image.vendor="Fossorial" \
      org.opencontainers.image.licenses="${LICENSE}" \
      org.opencontainers.image.title="${IMAGE_TITLE}" \
      org.opencontainers.image.description="${IMAGE_DESCRIPTION}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${REVISION}" \
      org.opencontainers.image.created="${CREATED}"

# Run as non-root user
USER node

ENTRYPOINT ["/entrypoint.sh"]
