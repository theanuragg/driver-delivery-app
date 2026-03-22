# Use Node.js as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Expo and React Native
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install global dependencies
RUN npm install -g expo-cli firebase-tools

# Copy package files
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose ports for Expo and Firebase Emulators
# Expo: 8081 (Metro), 19000-19002 (Expo CLI)
# Firebase: 9099 (Auth), 8080 (Firestore), 4000 (UI)
EXPOSE 8081 19000 19001 19002 9099 8080 4000

# Default command
CMD ["npm", "start"]
