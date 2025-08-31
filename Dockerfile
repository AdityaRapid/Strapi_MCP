# Use Node.js 18 LTS as base image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

CMD ["node", "build/http-server.js"]
