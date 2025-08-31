# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

# Change ownership of the app directory
RUN chown -R strapi:nodejs /app

# Switch to non-root user
USER strapi

# Expose port 8081 as required by Smithery
EXPOSE 8081

# Set environment variables with defaults
ENV NODE_ENV=production
ENV PORT=8081

# Health check using the HTTP server
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8081/ || exit 1

# Start the HTTP-based MCP server
CMD ["node", "build/http-server.js"]
