# Multi-stage build for LingoLab Backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY tsoa.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src/data-source.ts ./src/data-source.ts
COPY --from=builder /app/src/entities ./src/entities
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Install ts-node for migrations and seeding
RUN npm install -g ts-node typescript

# Create uploads and exports directories
RUN mkdir -p uploads exports

# Expose port
EXPOSE 3000

# Default command (will be overridden by docker-compose)
CMD ["npm", "start"]
