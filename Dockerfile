# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S strapi -u 1001

# Change ownership of the app directory
RUN chown -R strapi:nodejs /app

# Switch to non-root user
USER strapi

# Expose port for health checks and scanning
EXPOSE 3000

# Set environment variables with defaults
ENV NODE_ENV=production
ENV STRAPI_SERVER_NAME=default
ENV PORT=3000

# Health check using HTTP wrapper
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Add debug and wrapper scripts
COPY debug-startup.js ./
COPY http-wrapper.js ./

# Start the HTTP wrapper which can test and run the MCP server
CMD ["node", "http-wrapper.js"]
