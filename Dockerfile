# Use multi-stage build for optimized production image
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build argument for backend URL
ARG VITE_TALOSY_BACKEND_HOST=http://localhost:8000
ENV VITE_TALOSY_BACKEND_HOST=$VITE_TALOSY_BACKEND_HOST

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Start serve
CMD ["serve", "-s", "dist", "-l", "8080"]