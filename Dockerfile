# Build Stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./



# Install dependencies (including dev dependencies for build)
RUN npm ci



# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production



# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/routes ./routes



# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
