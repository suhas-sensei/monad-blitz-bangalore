FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code and ABI
COPY src/ ./src/
COPY abi/ ./abi/

# Build TypeScript
RUN npm run build

# Remove dev dependencies and source files
RUN npm prune --production && \
    rm -rf src tsconfig.json

# Create non-root user
RUN addgroup -g 1001 -S keeper && \
    adduser -S -u 1001 -G keeper keeper && \
    chown -R keeper:keeper /app

# Switch to non-root user
USER keeper

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the keeper
CMD ["node", "dist/index.js"]
