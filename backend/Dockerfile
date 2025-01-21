# Use an LTS version of Node.js
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json and package-lock.json for dependency installation
COPY package*.json ./

# Install dependencies (production only for smaller image size)
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Expose the port for documentation purposes
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
