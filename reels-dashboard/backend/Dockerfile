# Use Bun official image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Run the application
CMD ["bun", "run", "index.ts"]
