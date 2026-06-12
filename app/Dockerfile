FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Copy dependency files first (better Docker caching)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

EXPOSE 5000

# --require loads tracing.js before app.js so instrumentation patches
# Express and pg before they are imported by app.js
CMD ["node", "--require", "./tracing.js", "app.js"]