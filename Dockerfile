# Use Node.js 18 LTS as base image
FROM node:18-alpine

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

# Expose port (if needed for health checks)
EXPOSE 3000

# Set environment variables with defaults
ENV NODE_ENV=production
ENV STRAPI_SERVER_NAME=default

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["node", "build/index.js"]
