FROM node:24-alpine AS builder

WORKDIR /app

# COPY package.json package-lock.json ./
COPY package.json ./
RUN npm install

COPY . .

RUN npx drizzle-kit generate --dialect sqlite --schema ./server/db/schemas/ --out init

RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

# Curl used for the health checks
RUN apk add --no-cache curl

# COPY package.json package-lock.json ./
COPY package.json ./
RUN npm install --only=production && npm cache clean --force

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/init ./dist/init

COPY server/db/names.json ./dist/names.json

COPY public ./public

CMD ["npm", "start"]
