FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose the port from .env (usually 8000)
EXPOSE 8000

# Start the application
CMD ["npm", "start"]
