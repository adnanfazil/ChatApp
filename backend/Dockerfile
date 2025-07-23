FROM node:20.18.1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for nodemon)
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 9000

# Start the development server with nodemon
CMD ["npm", "run", "dev"]