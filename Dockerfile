## Multi-stage Dockerfile for Nest app
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy sources and build
COPY . .
# Generate Prisma client before building so TypeScript can import generated types
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --silent


COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built output
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3003
EXPOSE 3003

# Run the compiled Nest server
CMD ["node", "dist/main"]
